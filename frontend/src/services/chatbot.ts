// src/services/chat.ts
import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_URL, SECURITY_SERVICE_URL } from "@env";

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface SavedChat {
  userId: string;
  question: string;
  answer: string;
}

export interface ChatHistory {
  id: string;
  userId: string;
  question: string;
  answer: string;
  createdAt: string;
  isDeleted: boolean;
}

// Error types that match backend error codes
export interface ApiErrorResponse {
  error: string;
  message: string;
  code?: string;
  details?: any;
}

export class ChatServiceError extends Error {
  public code?: string;
  public statusCode?: number;
  public details?: any;

  constructor(
    message: string,
    code?: string,
    statusCode?: number,
    details?: any
  ) {
    super(message);
    this.name = "ChatServiceError";
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
  }
}

// Helper function to handle API errors
const handleApiError = async (response: Response): Promise<never> => {
  let errorData: ApiErrorResponse;

  try {
    errorData = await response.json();
  } catch {
    // If we can't parse JSON, create a generic error
    errorData = {
      error: "Network Error",
      message: `Request failed with status ${response.status}`,
      code: "NETWORK_ERROR",
    };
  }

  // Map specific error codes to user-friendly messages
  let userMessage = errorData.message;

  switch (errorData.code) {
    case "OPENAI_RATE_LIMIT":
      userMessage = "Too many requests. Please wait a moment and try again.";
      break;
    case "OPENAI_AUTH_ERROR":
      userMessage = "AI service authentication failed. Please contact support.";
      break;
    case "OPENAI_SERVICE_UNAVAILABLE":
      userMessage =
        "AI service is temporarily unavailable. Please try again later.";
      break;
    case "OPENAI_API_ERROR":
      userMessage =
        "AI service error. Please try again or contact support if the issue persists.";
      break;
    case "IMAGE_PROCESSING_ERROR":
      userMessage =
        "Failed to process the image. Please try with a different image.";
      break;
    case "VALIDATION_ERROR":
      userMessage = errorData.message || "Invalid input provided.";
      break;
    case "DATABASE_ERROR":
      userMessage = "Database error occurred. Please try again later.";
      break;
    case "FILE_UPLOAD_ERROR":
      userMessage = "Failed to upload file. Please try again.";
      break;
    case "NETWORK_ERROR":
      userMessage =
        "Network connection error. Please check your internet connection.";
      break;
    default:
      userMessage = errorData.message || "An unexpected error occurred.";
  }

  throw new ChatServiceError(
    userMessage,
    errorData.code,
    response.status,
    errorData.details
  );
};

export const sendChatMessage = async (
  user_query: string,
  chat_history: ChatMessage[] = []
): Promise<{ reply?: string; diagnosis?: string }> => {
  try {
    // Validate input
    if (!user_query || user_query.trim().length === 0) {
      throw new ChatServiceError(
        "Please enter a message before sending.",
        "VALIDATION_ERROR"
      );
    }

    // Get user ID from storage
    const userId = await AsyncStorage.getItem("userId");
    if (!userId) {
      throw new ChatServiceError(
        "Please log in to continue chatting.",
        "AUTH_REQUIRED"
      );
    }

    // Validate chat history format
    if (!Array.isArray(chat_history)) {
      throw new ChatServiceError(
        "Invalid chat history format.",
        "VALIDATION_ERROR"
      );
    }

    // Prepare form data for analysis endpoint
    const formData = new FormData();
    formData.append("user_query", user_query.trim());
    formData.append("chat_history", JSON.stringify(chat_history));

    // Send to analysis endpoint with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

    try {
      const analysisResponse = await fetch(`${API_URL}analyze_and_chat`, {
        method: "POST",
        body: formData,
        headers: {
          "Content-Type": "multipart/form-data",
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!analysisResponse.ok) {
        await handleApiError(analysisResponse);
      }

      const analysisData = await analysisResponse.json();

      // Validate response structure
      if (!analysisData || typeof analysisData !== "object") {
        throw new ChatServiceError(
          "Invalid response from AI service.",
          "INVALID_RESPONSE"
        );
      }

      const botResponse =
        analysisData.reply ||
        analysisData.diagnosis ||
        "I couldn't process that request. Please try rephrasing your question.";

      // Save conversation to database (don't fail the entire request if this fails)
      try {
        await saveChatToDb({
          userId,
          question: user_query.trim(),
          answer: botResponse,
        });
      } catch (saveError) {
        console.warn("Failed to save chat to database:", saveError);
        // Continue with the response even if saving fails
      }

      return {
        ...analysisData,
        reply: botResponse,
      };
    } catch (fetchError: any) {
      clearTimeout(timeoutId);

      if (fetchError.name === "AbortError") {
        throw new ChatServiceError(
          "Request timed out. Please try again.",
          "TIMEOUT_ERROR"
        );
      }

      throw fetchError;
    }
  } catch (error: any) {
    console.error("Chat service error:", error);

    // If it's already our custom error, re-throw it
    if (error instanceof ChatServiceError) {
      throw error;
    }

    // Handle network/connection errors
    if (
      error.message?.includes("Network request failed") ||
      error.message?.includes("fetch")
    ) {
      throw new ChatServiceError(
        "Network connection error. Please check your internet connection and try again.",
        "NETWORK_ERROR"
      );
    }

    // Generic error fallback
    throw new ChatServiceError(
      "An unexpected error occurred. Please try again.",
      "UNKNOWN_ERROR"
    );
  }
};

export const getUserChatHistory = async (
  includeDeleted: boolean = false
): Promise<ChatHistory[]> => {
  try {
    // Get user ID from storage
    const userId = await AsyncStorage.getItem("userId");
    if (!userId) {
      throw new ChatServiceError(
        "Please log in to view your chat history.",
        "AUTH_REQUIRED"
      );
    }

    // Create URL with proper encoding
    const url = new URL(`chats/${userId}`, API_URL);
    url.searchParams.set("include_deleted", includeDeleted.toString());

    // Fetch chat history from API with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

    try {
      const response = await fetch(url.toString(), {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        await handleApiError(response);
      }

      const data = await response.json();

      // Validate response structure
      if (!data || typeof data !== "object") {
        throw new ChatServiceError(
          "Invalid response format from server.",
          "INVALID_RESPONSE"
        );
      }

      if (data.status === "success") {
        // Validate that chats is an array
        const chats = data.chats || [];
        if (!Array.isArray(chats)) {
          throw new ChatServiceError(
            "Invalid chat history format received.",
            "INVALID_RESPONSE"
          );
        }
        return chats;
      } else {
        throw new ChatServiceError(
          data.message || "Failed to fetch chat history.",
          "FETCH_ERROR"
        );
      }
    } catch (fetchError: any) {
      clearTimeout(timeoutId);

      if (fetchError.name === "AbortError") {
        throw new ChatServiceError(
          "Request timed out while fetching chat history.",
          "TIMEOUT_ERROR"
        );
      }

      throw fetchError;
    }
  } catch (error: any) {
    console.error("Failed to fetch chat history:", error);

    // If it's already our custom error, re-throw it
    if (error instanceof ChatServiceError) {
      throw error;
    }

    // Handle network/connection errors
    if (
      error.message?.includes("Network request failed") ||
      error.message?.includes("fetch")
    ) {
      throw new ChatServiceError(
        "Network connection error. Please check your internet connection.",
        "NETWORK_ERROR"
      );
    }

    // Generic error fallback
    throw new ChatServiceError(
      "Failed to load chat history. Please try again.",
      "UNKNOWN_ERROR"
    );
  }
};

const saveChatToDb = async (chat: SavedChat): Promise<void> => {
  try {
    // Validate input
    if (!chat.userId || !chat.question || !chat.answer) {
      throw new ChatServiceError(
        "Invalid chat data provided.",
        "VALIDATION_ERROR"
      );
    }

    // Prepare the request with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

    try {
      const response = await fetch(`${API_URL}chats`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: chat.userId,
          question: chat.question.trim(),
          answer: chat.answer.trim(),
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        await handleApiError(response);
      }

      const data = await response.json();

      // Validate response
      if (!data || data.status !== "success") {
        throw new ChatServiceError(
          data?.message || "Failed to save chat.",
          "SAVE_ERROR"
        );
      }
    } catch (fetchError: any) {
      clearTimeout(timeoutId);

      if (fetchError.name === "AbortError") {
        throw new ChatServiceError(
          "Request timed out while saving chat.",
          "TIMEOUT_ERROR"
        );
      }

      throw fetchError;
    }
  } catch (error: any) {
    console.error("Failed to save chat:", error);

    // If it's already our custom error, re-throw it
    if (error instanceof ChatServiceError) {
      throw error;
    }

    // Handle network/connection errors
    if (
      error.message?.includes("Network request failed") ||
      error.message?.includes("fetch")
    ) {
      throw new ChatServiceError(
        "Network connection error while saving chat.",
        "NETWORK_ERROR"
      );
    }

    // Generic error fallback
    throw new ChatServiceError(
      "Failed to save chat. Please try again.",
      "UNKNOWN_ERROR"
    );
  }
};

// Helper function to check if error is recoverable
export const isRecoverableError = (error: ChatServiceError): boolean => {
  const recoverableCodes = [
    "NETWORK_ERROR",
    "TIMEOUT_ERROR",
    "OPENAI_RATE_LIMIT",
    "OPENAI_SERVICE_UNAVAILABLE",
  ];

  return recoverableCodes.includes(error.code || "");
};

// Helper function to get retry delay based on error type
export const getRetryDelay = (error: ChatServiceError): number => {
  switch (error.code) {
    case "OPENAI_RATE_LIMIT":
      return 60000; // 1 minute
    case "OPENAI_SERVICE_UNAVAILABLE":
      return 30000; // 30 seconds
    case "NETWORK_ERROR":
    case "TIMEOUT_ERROR":
      return 5000; // 5 seconds
    default:
      return 3000; // 3 seconds
  }
};
