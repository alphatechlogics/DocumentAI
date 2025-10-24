import { Platform } from "react-native";
import * as FileSystem from "expo-file-system";
import * as ImageManipulator from "expo-image-manipulator";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_URL } from "@env";

// Custom error types
class APIError extends Error {
  constructor(message: string, public status?: number, public details?: any) {
    super(message);
    this.name = "APIError";
  }
}

class ImageProcessingError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ImageProcessingError";
  }
}

class ValidationError extends Error {
  constructor(message: string, public field?: string) {
    super(message);
    this.name = "ValidationError";
  }
}

class AuthenticationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AuthenticationError";
  }
}

interface AnalysisResult {
  diagnosis: string;
  danger_level: number;
  reply?: string | null;
  chat_history?: Array<{
    role: string;
    content: string;
  }>;
}

interface MedicalRecordData {
  imageUri?: string;
  diagnosis?: string;
  dangerLevel?: number;
  questions?: Array<{ question: string; answer: string }>;
}

/**
 * Optimizes image with detailed error handling
 */
export const optimizeImageAdvanced = async (
  imageUri: string
): Promise<string> => {
  try {
    const originalFileInfo = await FileSystem.getInfoAsync(imageUri);
    if (!originalFileInfo.exists) {
      throw new ImageProcessingError("The selected image file doesn't exist");
    }
    if (!("size" in originalFileInfo)) {
      throw new ImageProcessingError("Couldn't read image file information");
    }

    const originalSize = originalFileInfo.size;
    if (originalSize < 100 * 1024) {
      return imageUri;
    }

    const targetSizeKB = originalSize > 1024 * 1024 ? 50 : 80;
    let initialWidth = 200;
    if (originalSize > 5 * 1024 * 1024) initialWidth = 150;
    else if (originalSize < 200 * 1024) initialWidth = 300;

    let compressionLevel = 0.6;
    if (originalSize > 2 * 1024 * 1024) compressionLevel = 0.4;

    let result = await ImageManipulator.manipulateAsync(
      imageUri,
      [{ resize: { width: initialWidth } }],
      { compress: compressionLevel, format: ImageManipulator.SaveFormat.JPEG }
    );

    let resultInfo = await FileSystem.getInfoAsync(result.uri);
    let currentSize =
      resultInfo.exists && "size" in resultInfo ? resultInfo.size : 0;
    let attempts = 1;
    const maxAttempts = 3;

    while (currentSize > targetSizeKB * 1024 && attempts < maxAttempts) {
      attempts++;
      compressionLevel = Math.max(0.2, compressionLevel - 0.15);
      initialWidth = Math.max(100, Math.floor(initialWidth * 0.8));

      result = await ImageManipulator.manipulateAsync(
        result.uri,
        [{ resize: { width: initialWidth } }],
        { compress: compressionLevel, format: ImageManipulator.SaveFormat.JPEG }
      );

      resultInfo = await FileSystem.getInfoAsync(result.uri);
      currentSize =
        resultInfo.exists && "size" in resultInfo ? resultInfo.size : 0;
    }

    return result.uri;
  } catch (error) {
    console.error("Image optimization error:", error);
    if (error instanceof ImageProcessingError) {
      throw error;
    }
    throw new ImageProcessingError(
      "Failed to process the image. Please try again or select a different image."
    );
  }
};

/**
 * Extract danger level from diagnosis text
 */
const extractDangerLevelFromText = (diagnosisText: string): number => {
  if (!diagnosisText) return 3;

  const patterns = [
    /\*\*Danger\s+Level\*\*\s*:\s*(\d+)/i,
    /Danger\s+Level\s*:\s*(\d+)/i,
    /danger.*?level.*?(\d+)/i,
    /level.*?danger.*?(\d+)/i,
    /severity.*?(\d+)/i,
  ];

  for (const pattern of patterns) {
    const match = diagnosisText.match(pattern);
    if (match && match[1]) {
      const level = parseInt(match[1], 10);
      if (!isNaN(level)) {
        return Math.max(0, Math.min(5, level));
      }
    }
  }

  return 3;
};

/**
 * Analyze skin image
 */
export const analyzeSkinImage = async (
  imageUrl: string
): Promise<AnalysisResult> => {
  try {
    if (!imageUrl) {
      throw new ValidationError("No image provided", "imageUrl");
    }

    const optimizedImageUrl = await optimizeImageAdvanced(imageUrl);
    const uriParts = optimizedImageUrl.split(".");
    const fileType = uriParts[uriParts.length - 1].toLowerCase();

    const formData = new FormData();
    formData.append("file", {
      uri:
        Platform.OS === "android"
          ? optimizedImageUrl
          : optimizedImageUrl.replace("file://", ""),
      name: `skin_image.${fileType}`,
      type: fileType === "png" ? "image/png" : "image/jpeg",
    } as any);

    const response = await fetch(`${API_URL}analyze_and_chat`, {
      method: "POST",
      body: formData,
      headers: { Accept: "application/json" },
    });

    if (!response.ok) {
      const errorText = await response.text();
      try {
        const errorData = JSON.parse(errorText);
        if (errorData.detail && Array.isArray(errorData.detail)) {
          const firstError = errorData.detail[0];
          throw new ValidationError(
            `${firstError.msg} (${firstError.loc.join(".")})`,
            firstError.loc[firstError.loc.length - 1]
          );
        }
        throw new APIError(
          errorData.message ||
            errorData.detail ||
            `API request failed (${response.status})`,
          response.status
        );
      } catch {
        throw new APIError(`Server error: ${errorText}`, response.status);
      }
    }

    const result = await response.json();
    if (!result.diagnosis) {
      throw new APIError("Invalid response from server - missing diagnosis");
    }

    return {
      diagnosis: result.diagnosis || "",
      danger_level:
        typeof result.danger_level === "number"
          ? Math.max(0, Math.min(5, result.danger_level))
          : extractDangerLevelFromText(result.diagnosis),
      reply: result.reply || null,
      chat_history: result.chat_history || [],
    };
  } catch (error) {
    console.error("Analysis error:", error);
    if (
      error instanceof TypeError &&
      error.message.includes("Network request failed")
    ) {
      throw new APIError(
        "Network error. Please check your internet connection and try again.",
        0
      );
    }
    if (
      error instanceof APIError ||
      error instanceof ValidationError ||
      error instanceof ImageProcessingError
    ) {
      throw error;
    }
    throw new APIError(
      "An unexpected error occurred during analysis. Please try again."
    );
  }
};

/**
 * Save medical record
 */
export const saveMedicalRecord = async (data: MedicalRecordData) => {
  try {
    if (!data.questions?.length && !data.imageUri && !data.diagnosis) {
      throw new ValidationError(
        "Must provide either questions, image, or diagnosis"
      );
    }

    if (
      data.dangerLevel !== undefined &&
      (data.dangerLevel < 0 || data.dangerLevel > 10)
    ) {
      throw new ValidationError(
        "Danger level must be between 0-10",
        "dangerLevel"
      );
    }

    const userId = await AsyncStorage.getItem("userId");
    if (!userId) {
      throw new AuthenticationError("Please sign in to save records");
    }

    const formData = new FormData();

    if (data.imageUri) {
      const optimizedImageUri = await optimizeImageAdvanced(data.imageUri);
      const filename =
        data.imageUri.split("/").pop() || `medical-${Date.now()}.jpg`;

      formData.append("file", {
        uri:
          Platform.OS === "android"
            ? optimizedImageUri
            : optimizedImageUri.replace("file://", ""),
        name: filename,
        type: "image/jpeg",
      } as any);
    }

    formData.append("patient_id", userId);
    formData.append("questions", JSON.stringify(data.questions || []));

    if (data.diagnosis) {
      formData.append("diagnosis", data.diagnosis);
    }

    if (data.dangerLevel !== undefined) {
      formData.append("danger_level", data.dangerLevel.toString());
    }

    const token = await AsyncStorage.getItem("token");
    const headers: Record<string, string> = {
      Accept: "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    };

    const response = await fetch(`${API_URL}analyze_and_store`, {
      method: "POST",
      headers,
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      try {
        const errorData = JSON.parse(errorText);
        if (response.status === 401 || response.status === 403) {
          throw new AuthenticationError(
            errorData.message || "Session expired. Please sign in again."
          );
        }
        if (errorData.detail && Array.isArray(errorData.detail)) {
          const firstError = errorData.detail[0];
          throw new ValidationError(
            `${firstError.msg} (${firstError.loc.join(".")})`,
            firstError.loc[firstError.loc.length - 1]
          );
        }
        throw new APIError(
          errorData.message || errorData.detail || "Failed to save record",
          response.status,
          errorData
        );
      } catch (parseError) {
        if (
          parseError instanceof ValidationError ||
          parseError instanceof AuthenticationError
        ) {
          throw parseError;
        }
        throw new APIError(`Server error: ${errorText}`, response.status);
      }
    }

    return await response.json();
  } catch (error) {
    console.error("Save record error:", error);
    if (
      error instanceof AuthenticationError ||
      error instanceof ValidationError ||
      error instanceof ImageProcessingError
    ) {
      throw error;
    }
    if (error instanceof APIError) {
      if (error.status === 413) {
        throw new APIError(
          "The image file is too large. Please try a smaller image.",
          413
        );
      }
      throw error;
    }
    if (
      error instanceof TypeError &&
      error.message.includes("Network request failed")
    ) {
      throw new APIError(
        "Network error. Please check your internet connection and try again.",
        0
      );
    }
    throw new APIError(
      "Failed to save medical record. Please check your connection and try again."
    );
  }
};

// Error message utility
export const getErrorMessage = (error: unknown): string => {
  if (error instanceof APIError) return error.message;
  if (error instanceof ValidationError)
    return `Validation error: ${error.message}`;
  if (error instanceof ImageProcessingError)
    return `Image error: ${error.message}`;
  if (error instanceof AuthenticationError) return error.message;
  if (error instanceof Error) return error.message;
  return "An unknown error occurred";
};
