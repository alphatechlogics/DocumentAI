import { AntDesign } from "@expo/vector-icons";
import {
  CameraType,
  CameraView,
  useCameraPermissions,
  CameraCapturedPicture,
} from "expo-camera";
import { useRef, useState, useEffect } from "react";
import {
  Image,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Alert,
  ActivityIndicator,
  Platform,
  ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import { Button } from "@/components/ui/Button";
import Questionnaire from "./symptoms";
import { GlobalStyles } from "@/styles/global";
import { analyzeSkinImage, saveMedicalRecord } from "@/src/services/api";

type ScreenState = "camera" | "preview" | "results" | "questionnaire";

const RISK_COLORS = {
  1: "#4CAF50",
  2: "#8BC34A",
  3: "#FFEB3B",
  4: "#FF9800",
  5: "#F44336",
};

function ResultsScreen({
  photo,
  diagnosis,
  dangerLevel = 0,
  isLoading,
  error,
  handleBack,
  handleAskQuestion,
  handleDone,
}: {
  photo: CameraCapturedPicture;
  diagnosis: string | null;
  dangerLevel?: number;
  isLoading: boolean;
  error: string | null;
  handleBack: () => void;
  handleAskQuestion: () => void;
  handleDone: () => void;
}) {
  const parseFormattedText = (text: string) => {
    if (!text) return null;

    // Split text into lines to handle headings and paragraphs
    const lines = text.split("\n");

    return lines.map((line, lineIndex) => {
      // Handle headings (###, ##, #)
      if (line.startsWith("###")) {
        const headingText = line.replace(/^###\s*/, "");
        return (
          <Text
            key={lineIndex}
            style={{
              fontWeight: "bold",
              fontSize: 18,
              marginTop: lineIndex > 0 ? 12 : 0,
              marginBottom: 6,
              color: "#333",
            }}
          >
            {headingText}
          </Text>
        );
      } else if (line.startsWith("##")) {
        const headingText = line.replace(/^##\s*/, "");
        return (
          <Text
            key={lineIndex}
            style={{
              fontWeight: "bold",
              fontSize: 20,
              marginTop: lineIndex > 0 ? 14 : 0,
              marginBottom: 8,
              color: "#333",
            }}
          >
            {headingText}
          </Text>
        );
      } else if (line.startsWith("#")) {
        const headingText = line.replace(/^#\s*/, "");
        return (
          <Text
            key={lineIndex}
            style={{
              fontWeight: "bold",
              fontSize: 22,
              marginTop: lineIndex > 0 ? 16 : 0,
              marginBottom: 10,
              color: "#333",
            }}
          >
            {headingText}
          </Text>
        );
      }

      // Handle regular text with bold formatting
      if (line.trim() === "") {
        // Empty line - add spacing
        return (
          <Text key={lineIndex} style={{ marginBottom: 6 }}>
            {"\n"}
          </Text>
        );
      }

      // Split by bold markers (**text**)
      const parts = line.split(/(\*\*.*?\*\*)/g);
      const formattedParts = parts.map((part, partIndex) => {
        if (part.startsWith("**") && part.endsWith("**")) {
          const boldText = part.slice(2, -2);
          return (
            <Text
              key={`${lineIndex}-${partIndex}`}
              style={{ fontWeight: "bold" }}
            >
              {boldText}
            </Text>
          );
        }
        return <Text key={`${lineIndex}-${partIndex}`}>{part}</Text>;
      });

      return (
        <Text
          key={lineIndex}
          style={{
            marginBottom: 4,
            lineHeight: 22,
          }}
        >
          {formattedParts}
        </Text>
      );
    });
  };

  // Create the danger level indicator with dynamic positioning
  const renderDangerLevelIndicator = () => {
    const clampedLevel = Math.max(0, Math.min(5, dangerLevel)); // Ensure level is between 0-5
    const position = (clampedLevel / 5) * 100; // Convert to percentage

    return (
      <View style={styles.dangerLevelSection}>
        <Text style={styles.diagnosisLabel}>
          Danger level: {clampedLevel}/5
        </Text>
        <View style={styles.dangerLevelContainer}>
          <View style={styles.dangerLevelTrack}>
            {/* Render level markers */}
            {[0, 1, 2, 3, 4, 5].map((level) => (
              <View
                key={level}
                style={[
                  styles.dangerLevelMarker,
                  {
                    left: `${(level / 5) * 100}%`,
                    backgroundColor:
                      level <= clampedLevel
                        ? RISK_COLORS[
                            Math.max(1, level) as keyof typeof RISK_COLORS
                          ]
                        : "#e0e0e0",
                  },
                ]}
              />
            ))}
            {/* Dynamic indicator */}
            <View
              style={[
                styles.dangerLevelIndicator,
                {
                  left: `${position}%`,
                  backgroundColor:
                    RISK_COLORS[
                      Math.max(1, clampedLevel) as keyof typeof RISK_COLORS
                    ] || "#e0e0e0",
                },
              ]}
            />
          </View>
          <View style={styles.dangerLevelLabels}>
            <Text style={styles.dangerLevelText}>0</Text>
            <Text style={styles.dangerLevelText}>5</Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.mainContent}>
        <Text style={styles.imageTitle}>Image you took</Text>
        <Image
          style={styles.resultImage}
          source={{ uri: photo.uri }}
          resizeMode="contain"
        />

        <View style={styles.diagnosisCard}>
          {renderDangerLevelIndicator()}

          <View style={styles.diagnosisSection}>
            <Text style={styles.diagnosisLabel}>Diagnosis:</Text>
            {isLoading ? (
              <ActivityIndicator size="large" color="#9948a3" />
            ) : error ? (
              <Text style={styles.errorText}>{error}</Text>
            ) : (
              <View style={styles.diagnosisTextContainer}>
                <ScrollView
                  style={styles.diagnosisScroll}
                  showsVerticalScrollIndicator={true}
                  indicatorStyle="white"
                >
                  <Text style={styles.diagnosisText}>
                    {parseFormattedText(
                      diagnosis ||
                        "No diagnosis available. Please try again with a clearer image."
                    )}
                  </Text>
                </ScrollView>
              </View>
            )}
          </View>

          <View style={styles.buttonGroup}>
            <TouchableOpacity
              style={styles.askButton}
              onPress={handleAskQuestion}
              disabled={isLoading || !!error}
            >
              <Text style={styles.askButtonText}>Ask question</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.doneButton}
              onPress={handleDone}
              disabled={isLoading}
            >
              <Text style={styles.doneButtonText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

function PhotoPreviewWrapper({
  photo,
  onRetake,
  onUpload,
  isUploading,
}: {
  photo: CameraCapturedPicture;
  onRetake: () => void;
  onUpload: () => void;
  isUploading: boolean;
}) {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.previewContainer}>
        <Image source={{ uri: photo.uri }} style={styles.previewImage} />
      </View>
      <View style={styles.buttonRow}>
        <TouchableOpacity
          style={[styles.actionButton, isUploading && styles.disabledButton]}
          onPress={onRetake}
          disabled={isUploading}
        >
          <Text style={styles.buttonText}>Retake</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, isUploading && styles.disabledButton]}
          onPress={onUpload}
          disabled={isUploading}
        >
          <Text style={styles.buttonText}>
            {isUploading ? "Processing..." : "Analyze Image"}
          </Text>
        </TouchableOpacity>
      </View>
      {isUploading && (
        <ActivityIndicator
          size="large"
          color="#9948a3"
          style={styles.loadingSpinner}
        />
      )}
    </SafeAreaView>
  );
}

export default function SkinAnalysisCamera() {
  const [facing, setFacing] = useState<"front" | "back">("back");
  const [permission, requestPermission] = useCameraPermissions();
  const [screenState, setScreenState] = useState<ScreenState>("camera");
  const [photo, setPhoto] = useState<CameraCapturedPicture | null>(null);
  const [diagnosis, setDiagnosis] = useState<string | null>(null);
  const [dangerLevel, setDangerLevel] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [questionnaireAnswers, setQuestionnaireAnswers] = useState<boolean[]>(
    []
  );
  const cameraRef = useRef<CameraView>(null);
  const router = useRouter();

  useEffect(() => {
    if (!permission?.granted) {
      requestPermission();
    }
  }, [permission]);

  const takePhoto = async () => {
    if (cameraRef.current) {
      try {
        const options = {
          quality: 0.5,
          base64: false,
          skipProcessing: false,
          exif: false,
          format: Platform.OS === "android" ? "jpeg" : undefined,
        };

        const photo = await cameraRef.current.takePictureAsync(options);
        setPhoto(photo);
        setScreenState("preview");
      } catch (err) {
        console.error("Error taking photo:", err);
        Alert.alert("Error", "Failed to take photo. Please try again.");
      }
    }
  };

  // Extract danger level from diagnosis text
  const extractDangerLevel = (diagnosisText: string): number => {
    console.log("Full diagnosis text:", diagnosisText);

    // Try multiple patterns to match danger level
    const patterns = [
      /\*\*Danger Level\*\*:\s*(\d+)/i, // **Danger Level**: 1
      /Danger Level:\s*(\d+)/i, // Danger Level: 1
      /\*\*Danger Level\*\*\s*:\s*(\d+)/i, // **Danger Level** : 1
      /danger\s+level[:\s]*(\d+)/i, // danger level 1 or danger level: 1
    ];

    for (const pattern of patterns) {
      const match = diagnosisText.match(pattern);
      if (match) {
        const level = parseInt(match[1], 10);
        console.log("Extracted level:", level, "using pattern:", pattern);
        return Math.max(0, Math.min(5, level)); // Clamp between 0-5
      }
    }

    console.log("No danger level found, using default");
    return 3; // Default fallback
  };

  const uploadPhoto = async () => {
    if (!photo) return;

    setIsLoading(true);
    setError(null);

    try {
      const result = await analyzeSkinImage(photo.uri);
      setDiagnosis(result.diagnosis);

      // Extract danger level from diagnosis text
      const extractedDangerLevel = extractDangerLevel(result.diagnosis);
      setDangerLevel(extractedDangerLevel);

      setScreenState("results");
    } catch (err) {
      let errorMessage = "Analysis failed. Please try again.";
      if (err instanceof Error) {
        errorMessage = err.message;
        if (err.message.includes("context_length_exceeded")) {
          errorMessage =
            "Image is too large. Please try again with different lighting or focus.";
        } else if (err.message.includes("422")) {
          errorMessage = "Invalid image format. Please take a clearer photo.";
        } else if (
          err.message.includes("400") &&
          err.message.includes("boundary")
        ) {
          errorMessage = "Communication error with server. Please try again.";
        } else if (err.message.includes("Network request failed")) {
          errorMessage =
            "Network connection error. Please check your connection and try again.";
        }
      }
      setError(errorMessage);
      Alert.alert("Error", errorMessage);
      setScreenState("camera");
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuestionnaireComplete = async (answers: boolean[]) => {
    setIsLoading(true);
    try {
      const questions = [
        "Do you have a cough?",
        "Do you have a fever?",
        "Is the affected area painful?",
        "Have you noticed any swelling?",
        "Does the affected area itch?",
      ];

      const questionsData = questions.map((question, index) => ({
        question,
        answer: answers[index] ? "Yes" : "No",
      }));

      await saveMedicalRecord({
        imageUri: photo!.uri,
        diagnosis: diagnosis!,
        dangerLevel,
        questions: questionsData,
      });
    } catch (err) {
      console.error("Error saving record:", err);
      throw new Error("Failed to save medical record");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAskQuestion = () => {
    setScreenState("questionnaire");
  };

  const handleDone = async () => {
    if (!photo || !diagnosis) return;

    setIsLoading(true);
    try {
      await saveMedicalRecord({
        imageUri: photo.uri,
        diagnosis,
        dangerLevel,
        questions: [],
      });
      router.replace("/home");
    } catch (err) {
      console.error("Error saving record:", err);
      Alert.alert("Error", "Failed to save medical record");
    } finally {
      setIsLoading(false);
    }
  };

  const resetCamera = () => {
    setPhoto(null);
    setDiagnosis(null);
    setDangerLevel(0);
    setError(null);
    setQuestionnaireAnswers([]);
    setScreenState("camera");
  };

  if (!permission) {
    return <View style={styles.container} />;
  }

  if (!permission.granted) {
    return (
      <View style={styles.permissionContainer}>
        <Text style={styles.permissionText}>
          We need access to your camera to analyze skin conditions
        </Text>
        <Button onPress={requestPermission} title="Grant Permission" />
      </View>
    );
  }

  if (screenState === "results" && photo) {
    return (
      <ResultsScreen
        photo={photo}
        diagnosis={diagnosis}
        dangerLevel={dangerLevel}
        isLoading={isLoading}
        error={error}
        handleBack={resetCamera}
        handleAskQuestion={handleAskQuestion}
        handleDone={handleDone}
      />
    );
  }

  if (screenState === "questionnaire") {
    return (
      <Questionnaire
        onComplete={handleQuestionnaireComplete}
        onCancel={resetCamera}
      />
    );
  }

  if (screenState === "preview" && photo) {
    return (
      <PhotoPreviewWrapper
        photo={photo}
        onRetake={resetCamera}
        onUpload={uploadPhoto}
        isUploading={isLoading}
      />
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        style={styles.camera}
        facing={facing}
        ref={cameraRef}
        enableTorch={false}
      >
        <View style={styles.controlsContainer}>
          <TouchableOpacity
            style={styles.controlButton}
            onPress={() => setFacing(facing === "back" ? "front" : "back")}
          >
            <AntDesign name="retweet" size={28} color="white" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.captureButton} onPress={takePhoto}>
            <View style={styles.captureButtonInner} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.controlButton}
            onPress={() => router.back()}
          >
            <AntDesign name="close" size={28} color="white" />
          </TouchableOpacity>
        </View>
      </CameraView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "black",
  },
  mainContent: {
    flex: 1,
    backgroundColor: "black",
  },
  imageTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "white",
    textAlign: "center",
    marginVertical: 15,
  },
  permissionContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: "black",
  },
  permissionText: {
    color: "white",
    fontSize: 18,
    textAlign: "center",
    marginBottom: 20,
  },
  camera: {
    flex: 1,
  },
  controlsContainer: {
    position: "absolute",
    bottom: 40,
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 30,
  },
  controlButton: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 50,
    padding: 15,
  },
  captureButton: {
    borderWidth: 4,
    borderColor: "rgba(255, 255, 255, 0.5)",
    borderRadius: 50,
    padding: 4,
  },
  captureButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "white",
  },
  previewContainer: {
    flex: 1,
    justifyContent: "center",
  },
  previewImage: {
    width: "100%",
    height: "80%",
    borderRadius: 10,
  },
  resultImage: {
    width: "95%",
    height: 250,
    borderRadius: 10,
    marginBottom: 0,
    alignSelf: "center",
  },
  diagnosisCard: {
    backgroundColor: "#f5f5f5",
    borderRadius: 15,
    marginHorizontal: 20,
    paddingVertical: 8,
    paddingHorizontal: 20,
  },
  dangerLevelSection: {
    marginBottom: 5,
  },
  dangerLevelBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 1,
  },
  dangerLevelValue: {
    width: 25,
    height: 25,
    borderWidth: 1,
    borderColor: "#000",
    justifyContent: "center",
    alignItems: "center",
  },
  dangerLevelLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#000",
    marginHorizontal: 5,
  },
  diagnosisSection: {
    marginBottom: 0,
  },
  diagnosisLabel: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 2,
  },
  diagnosisTextContainer: {
    maxHeight: 60,
    marginBottom: 15,
  },
  diagnosisScroll: {
    paddingVertical: 5,
    color: "#00000",
  },
  diagnosisText: {
    fontSize: 16,
    lineHeight: 22,
  },
  errorText: {
    color: "red",
    fontSize: 16,
  },
  buttonGroup: {
    gap: 5,
  },
  askButton: {
    backgroundColor: "#9948a3",
    paddingVertical: 8,
    borderRadius: 30,
    alignItems: "center",
  },
  askButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  doneButton: {
    backgroundColor: "black",
    paddingVertical: 8,
    borderRadius: 30,
    alignItems: "center",
  },
  doneButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  loadingSpinner: {
    marginTop: 20,
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  actionButton: {
    backgroundColor: "#9948a3",
    paddingVertical: 10,
    paddingHorizontal: 25,
    borderRadius: 25,
    alignItems: "center",
    justifyContent: "center",
  },
  disabledButton: {
    opacity: 0.6,
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  dangerLevelText: {
    fontSize: 16,
    fontWeight: "bold",
  },
  dangerLevelContainer: {
    marginVertical: 10,
  },
  dangerLevelTrack: {
    height: 20,
    backgroundColor: "#e0e0e0",
    borderRadius: 10,
    position: "relative" as const,
    marginBottom: 5,
  },
  dangerLevelMarker: {
    position: "absolute" as const,
    width: 16,
    height: 16,
    borderRadius: 8,
    top: 2,
    marginLeft: -8, // Center the marker
    borderWidth: 2,
    borderColor: "white",
  },
  dangerLevelIndicator: {
    position: "absolute" as const,
    width: 20,
    height: 20,
    borderRadius: 10,
    top: 0,
    marginLeft: -10, // Center the indicator
    borderWidth: 3,
    borderColor: "white",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  dangerLevelLabels: {
    flexDirection: "row" as const,
    justifyContent: "space-between",
  },
});
