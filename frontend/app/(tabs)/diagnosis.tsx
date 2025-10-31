import { AntDesign } from "@expo/vector-icons";
import {
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
import { diagnosisService } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { StoredDiagnosisResponse } from "@/lib/api/types";

type ScreenState = "camera" | "preview" | "results";

function ResultsScreen({
  photo,
  result,
  isLoading,
  error,
  handleBack,
  handleViewHistory,
}: {
  photo: CameraCapturedPicture;
  result: StoredDiagnosisResponse | null;
  isLoading: boolean;
  error: string | null;
  handleBack: () => void;
  handleViewHistory: () => void;
}) {
  const parseFormattedText = (text: string) => {
    if (!text) return null;

    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, index) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        const boldText = part.slice(2, -2);
        return (
          <Text key={index} style={{ fontWeight: "bold" }}>
            {boldText}
          </Text>
        );
      }
      return <Text key={index}>{part}</Text>;
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.mainContent}>
        <Text style={styles.imageTitle}>Medical Image Analysis</Text>
        <Image
          style={styles.resultImage}
          source={{ uri: photo.uri }}
          resizeMode="contain"
        />

        <View style={styles.diagnosisCard}>
          {/* Image Type */}
          {result && (
            <View style={styles.infoSection}>
              <Text style={styles.infoLabel}>Image Type:</Text>
              <Text style={styles.infoText}>{result.image_type}</Text>
            </View>
          )}

          {/* Confidence Score */}
          {result && (
            <View style={styles.confidenceSection}>
              <Text style={styles.infoLabel}>Confidence Score:</Text>
              <View style={styles.confidenceBar}>
                <View
                  style={[
                    styles.confidenceFill,
                    { width: `${result.confidence_score * 100}%` },
                  ]}
                />
              </View>
              <Text style={styles.confidenceText}>
                {(result.confidence_score * 100).toFixed(0)}%
              </Text>
            </View>
          )}

          {/* Diagnosis (English) */}
          <View style={styles.diagnosisSection}>
            <Text style={styles.diagnosisLabel}>Diagnosis:</Text>
            {isLoading ? (
              <ActivityIndicator size="large" color="#7C5FDC" />
            ) : error ? (
              <Text style={styles.errorText}>{error}</Text>
            ) : result ? (
              <View style={styles.diagnosisTextContainer}>
                <ScrollView
                  style={styles.diagnosisScroll}
                  showsVerticalScrollIndicator={true}
                >
                  <Text style={styles.diagnosisText}>
                    {parseFormattedText(result.diagnosis_english)}
                  </Text>
                </ScrollView>
              </View>
            ) : (
              <Text style={styles.diagnosisText}>
                No diagnosis available. Please try again.
              </Text>
            )}
          </View>

          {/* Diagnosis (Arabic) */}
          {result && result.diagnosis_arabic && (
            <View style={styles.diagnosisSection}>
              <Text style={styles.diagnosisLabel}>التشخيص:</Text>
              <View style={styles.diagnosisTextContainer}>
                <ScrollView
                  style={styles.diagnosisScroll}
                  showsVerticalScrollIndicator={true}
                >
                  <Text style={[styles.diagnosisText, styles.arabicText]}>
                    {result.diagnosis_arabic}
                  </Text>
                </ScrollView>
              </View>
            </View>
          )}

          {/* Findings */}
          {result && result.findings && result.findings.length > 0 && (
            <View style={styles.findingsSection}>
              <Text style={styles.diagnosisLabel}>Key Findings:</Text>
              {result.findings.map((finding, index) => (
                <Text key={index} style={styles.findingItem}>
                  • {finding}
                </Text>
              ))}
            </View>
          )}

          {/* Recommendations */}
          {result && result.recommendations && (
            <View style={styles.recommendationsSection}>
              <Text style={styles.diagnosisLabel}>Recommendations:</Text>
              <Text style={styles.recommendationsText}>
                {result.recommendations}
              </Text>
            </View>
          )}

          <View style={styles.buttonGroup}>
            <TouchableOpacity
              style={styles.historyButton}
              onPress={handleViewHistory}
              disabled={isLoading || !!error}
            >
              <Text style={styles.historyButtonText}>View History</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.doneButton} onPress={handleBack}>
              <Text style={styles.doneButtonText}>Take Another</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function PhotoPreviewWrapper({
  photo,
  onRetake,
  onAnalyze,
  isAnalyzing,
}: {
  photo: CameraCapturedPicture;
  onRetake: () => void;
  onAnalyze: () => void;
  isAnalyzing: boolean;
}) {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.previewContainer}>
        <Image source={{ uri: photo.uri }} style={styles.previewImage} />
      </View>
      <View style={styles.buttonRow}>
        <TouchableOpacity
          style={[styles.actionButton, isAnalyzing && styles.disabledButton]}
          onPress={onRetake}
          disabled={isAnalyzing}
        >
          <Text style={styles.buttonText}>Retake</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.actionButton,
            styles.analyzeButton,
            isAnalyzing && styles.disabledButton,
          ]}
          onPress={onAnalyze}
          disabled={isAnalyzing}
        >
          <Text style={styles.buttonText}>
            {isAnalyzing ? "Analyzing..." : "Analyze Image"}
          </Text>
        </TouchableOpacity>
      </View>
      {isAnalyzing && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#7C5FDC" />
          <Text style={styles.loadingText}>Analyzing medical image...</Text>
        </View>
      )}
    </SafeAreaView>
  );
}

export default function MedicalImageCamera() {
  const [facing, setFacing] = useState<"front" | "back">("back");
  const [permission, requestPermission] = useCameraPermissions();
  const [screenState, setScreenState] = useState<ScreenState>("camera");
  const [photo, setPhoto] = useState<CameraCapturedPicture | null>(null);
  const [result, setResult] = useState<StoredDiagnosisResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const cameraRef = useRef<CameraView>(null);
  const router = useRouter();
  const { state } = useAuth();

  useEffect(() => {
    if (!permission?.granted) {
      requestPermission();
    }
  }, [permission]);

  const takePhoto = async () => {
    if (cameraRef.current) {
      try {
        const options = {
          quality: 0.7,
          base64: false,
          skipProcessing: false,
          exif: false,
        };

        const photo = await cameraRef.current.takePictureAsync(options);
        console.log("Photo taken:", photo.uri);

        setPhoto(photo);
        setScreenState("preview");
      } catch (err) {
        console.error("Error taking photo:", err);
        Alert.alert("Error", "Failed to take photo. Please try again.");
      }
    }
  };

  const analyzePhoto = async () => {
    if (!photo) return;

    setIsLoading(true);
    setError(null);

    try {
      console.log("Starting medical image analysis...");

      // Get file extension
      const uriParts = photo.uri.split(".");
      const fileExt = uriParts[uriParts.length - 1].toLowerCase();

      // Prepare file data
      const fileData = {
        uri: photo.uri,
        name: `medical_image_${Date.now()}.${fileExt}`,
        type: `image/${fileExt === "jpg" ? "jpeg" : fileExt}`,
      };

      // Call the API to analyze and store the image
      const apiResult = await diagnosisService.analyzeAndStoreImage({
        file: fileData,
        patient_id: state.user?.email, // Using email as patient_id
      });

      if (apiResult.success && apiResult.data) {
        setResult(apiResult.data);
        setScreenState("results");
      } else {
        throw new Error(apiResult.error || "Analysis failed");
      }
    } catch (err) {
      let errorMessage = "Analysis failed. Please try again.";

      if (err instanceof Error) {
        errorMessage = err.message;
      }

      console.error("Analysis error:", errorMessage);
      setError(errorMessage);
      Alert.alert("Error", errorMessage);
      setScreenState("camera");
    } finally {
      setIsLoading(false);
    }
  };

  const resetCamera = () => {
    setPhoto(null);
    setResult(null);
    setError(null);
    setScreenState("camera");
  };

  const handleViewHistory = () => {
    router.push("/(tabs)/history");
  };

  if (!permission) {
    return <View style={styles.container} />;
  }

  if (!permission.granted) {
    return (
      <View style={styles.permissionContainer}>
        <Text style={styles.permissionText}>
          We need camera access to analyze medical images
        </Text>
        <TouchableOpacity
          style={styles.permissionButton}
          onPress={requestPermission}
        >
          <Text style={styles.permissionButtonText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (screenState === "results" && photo) {
    return (
      <ResultsScreen
        photo={photo}
        result={result}
        isLoading={isLoading}
        error={error}
        handleBack={resetCamera}
        handleViewHistory={handleViewHistory}
      />
    );
  }

  if (screenState === "preview" && photo) {
    return (
      <PhotoPreviewWrapper
        photo={photo}
        onRetake={resetCamera}
        onAnalyze={analyzePhoto}
        isAnalyzing={isLoading}
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
        <View style={styles.cameraOverlay}>
          <Text style={styles.cameraTitle}>Medical Image Analysis</Text>
          <Text style={styles.cameraSubtitle}>
            Position the medical image clearly
          </Text>
        </View>

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
    backgroundColor: "#F5F5F5",
  },
  imageTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#333",
    textAlign: "center",
    marginVertical: 20,
  },
  permissionContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#F5F5F5",
  },
  permissionText: {
    color: "#333",
    fontSize: 18,
    textAlign: "center",
    marginBottom: 20,
  },
  permissionButton: {
    backgroundColor: "#7C5FDC",
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 25,
  },
  permissionButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  camera: {
    flex: 1,
  },
  cameraOverlay: {
    position: "absolute",
    top: 60,
    width: "100%",
    alignItems: "center",
  },
  cameraTitle: {
    color: "white",
    fontSize: 24,
    fontWeight: "bold",
    textShadowColor: "rgba(0, 0, 0, 0.75)",
    textShadowOffset: { width: -1, height: 1 },
    textShadowRadius: 10,
  },
  cameraSubtitle: {
    color: "white",
    fontSize: 16,
    marginTop: 8,
    textShadowColor: "rgba(0, 0, 0, 0.75)",
    textShadowOffset: { width: -1, height: 1 },
    textShadowRadius: 10,
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
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    borderRadius: 50,
    padding: 15,
  },
  captureButton: {
    borderWidth: 4,
    borderColor: "white",
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
    backgroundColor: "black",
  },
  previewImage: {
    width: "100%",
    height: "85%",
  },
  resultImage: {
    width: "90%",
    height: 250,
    borderRadius: 15,
    marginBottom: 20,
    alignSelf: "center",
    backgroundColor: "#E0E0E0",
  },
  diagnosisCard: {
    backgroundColor: "white",
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  infoSection: {
    marginBottom: 15,
  },
  infoLabel: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 5,
  },
  infoText: {
    fontSize: 16,
    color: "#666",
  },
  confidenceSection: {
    marginBottom: 20,
  },
  confidenceBar: {
    height: 10,
    backgroundColor: "#E0E0E0",
    borderRadius: 5,
    marginTop: 5,
    marginBottom: 5,
    overflow: "hidden",
  },
  confidenceFill: {
    height: "100%",
    backgroundColor: "#7C5FDC",
    borderRadius: 5,
  },
  confidenceText: {
    fontSize: 14,
    color: "#666",
    textAlign: "right",
  },
  diagnosisSection: {
    marginBottom: 20,
  },
  diagnosisLabel: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 8,
  },
  diagnosisTextContainer: {
    maxHeight: 150,
  },
  diagnosisScroll: {
    paddingVertical: 5,
  },
  diagnosisText: {
    fontSize: 15,
    lineHeight: 22,
    color: "#444",
  },
  arabicText: {
    textAlign: "right",
    writingDirection: "rtl",
  },
  findingsSection: {
    marginBottom: 20,
  },
  findingItem: {
    fontSize: 15,
    color: "#444",
    marginBottom: 5,
    lineHeight: 20,
  },
  recommendationsSection: {
    marginBottom: 20,
    backgroundColor: "#FFF3E0",
    padding: 15,
    borderRadius: 10,
  },
  recommendationsText: {
    fontSize: 15,
    color: "#444",
    lineHeight: 20,
  },
  errorText: {
    color: "#F44336",
    fontSize: 16,
    textAlign: "center",
  },
  buttonGroup: {
    gap: 12,
    marginTop: 10,
  },
  historyButton: {
    backgroundColor: "#7C5FDC",
    paddingVertical: 14,
    borderRadius: 25,
    alignItems: "center",
  },
  historyButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  doneButton: {
    backgroundColor: "#333",
    paddingVertical: 14,
    borderRadius: 25,
    alignItems: "center",
  },
  doneButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingHorizontal: 20,
    marginBottom: 20,
    gap: 10,
  },
  actionButton: {
    backgroundColor: "#666",
    paddingVertical: 14,
    paddingHorizontal: 30,
    borderRadius: 25,
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
  },
  analyzeButton: {
    backgroundColor: "#7C5FDC",
  },
  disabledButton: {
    opacity: 0.6,
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  loadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    color: "white",
    fontSize: 16,
    marginTop: 15,
  },
});
