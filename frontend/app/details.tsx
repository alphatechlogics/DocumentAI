import React from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { useLocalSearchParams } from "expo-router";

const RISK_COLORS = {
  1: "#4CAF50",
  2: "#8BC34A",
  3: "#FFEB3B",
  4: "#FF9800",
  5: "#F44336",
};

// Helper function to render formatted text
const renderFormattedText = (text: string) => {
  if (!text) return null;

  // Split text into parts based on markdown-like syntax
  const parts = text.split(/(\*\*.*?\*\*|### .*?\n)/).filter((part) => part);

  return parts.map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      // Bold text
      return (
        <Text key={index} style={styles.boldText}>
          {part.slice(2, -2)}
        </Text>
      );
    } else if (part.startsWith("### ")) {
      // Heading
      return (
        <Text key={index} style={styles.subSectionTitle}>
          {part.slice(4).trim()}
        </Text>
      );
    } else {
      // Regular text
      return (
        <Text key={index} style={styles.detailText}>
          {part}
        </Text>
      );
    }
  });
};

// Extract danger level from diagnosis text (same as camera component)
const extractDangerLevel = (diagnosisText: string): number => {
  if (!diagnosisText) return 0;

  const patterns = [
    /\*\*Danger Level\*\*:\s*(\d+)/i,
    /Danger Level:\s*(\d+)/i,
    /\*\*Danger Level\*\*\s*:\s*(\d+)/i,
    /danger\s+level[:\s]*(\d+)/i,
  ];

  for (const pattern of patterns) {
    const match = diagnosisText.match(pattern);
    if (match) {
      const level = parseInt(match[1], 10);
      return Math.max(0, Math.min(5, level));
    }
  }

  return 0; // Default to 0 if not found
};

const DangerLevelIndicator = ({ level }: { level: number }) => {
  const clampedLevel = Math.max(0, Math.min(5, level));
  const position = (clampedLevel / 5) * 100;

  return (
    <View style={styles.dangerLevelSection}>
      <Text style={styles.diagnosisLabel}>Danger level: {clampedLevel}/5</Text>
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

export default function DetailsScreen() {
  const params = useLocalSearchParams();

  // Extract all parameters with proper type checking
  const { id, image_url, description, date, title, questions } = params as {
    id: string;
    image_url?: string;
    description?: string;
    date?: string;
    title?: string;
    questions?: string;
  };

  // Parse questions if they exist
  const parsedQuestions = questions ? JSON.parse(questions) : [];

  // Extract danger level from description
  const dangerLevel = description ? extractDangerLevel(description) : 0;

  if (!id) {
    return (
      <View style={styles.centeredContainer}>
        <ActivityIndicator size="large" color="#4361ee" />
      </View>
    );
  }

  const hasImage = !!image_url;
  const hasDiagnosis = !!description;
  const hasQuestions = parsedQuestions.length > 0;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
    >
      {/* Image Section - only show if image exists */}
      {hasImage && (
        <View style={styles.imageSection}>
          <Image
            source={{ uri: image_url }}
            style={styles.headerImage}
            resizeMode="cover"
          />
        </View>
      )}

      {/* Details Section */}
      <View style={styles.detailSection}>
        <Text style={styles.sectionTitle}>Analysis Details</Text>

        <View style={styles.detailCard}>
          <Text style={styles.detailTitle}>{title || "Medical Record"}</Text>
          {date && <Text style={styles.detailDate}>{date}</Text>}

          {/* Danger Level Indicator */}
          {hasDiagnosis && dangerLevel > 0 && (
            <DangerLevelIndicator level={dangerLevel} />
          )}

          {/* Full Diagnosis with formatted text - only show if exists */}
          {hasDiagnosis && (
            <>
              <Text style={styles.subSectionTitle}>Diagnosis</Text>
              <View style={styles.diagnosisText}>
                {renderFormattedText(description)}
              </View>
            </>
          )}

          {/* Questions & Answers - always show if they exist */}
          {hasQuestions && (
            <>
              <Text style={styles.subSectionTitle}>Symptoms</Text>
              <View style={styles.questionsContainer}>
                {parsedQuestions.map((q: any, index: number) => (
                  <View key={index} style={styles.questionItem}>
                    <Text style={styles.questionText}>• {q.question}</Text>
                    <Text style={styles.answerText}>Answer: {q.answer}</Text>
                  </View>
                ))}
              </View>
            </>
          )}

          {/* Show message if no content */}
          {!hasDiagnosis && !hasQuestions && (
            <Text style={styles.detailText}>
              No details available for this record
            </Text>
          )}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 30,
  },
  centeredContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  imageSection: {
    marginBottom: 20,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  headerImage: {
    width: "100%",
    height: 290,
  },
  detailSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#000",
    marginBottom: 16,
  },
  subSectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000",
    marginTop: 16,
    marginBottom: 8,
  },
  detailCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  detailTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#000",
    marginBottom: 8,
  },
  detailDate: {
    fontSize: 14,
    color: "#666",
    marginBottom: 12,
  },
  diagnosisText: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  detailText: {
    fontSize: 16,
    color: "#333",
    lineHeight: 24,
  },
  boldText: {
    fontSize: 16,
    color: "#333",
    fontWeight: "bold",
    lineHeight: 24,
  },
  questionsContainer: {
    marginTop: 8,
  },
  questionItem: {
    marginBottom: 12,
  },
  questionText: {
    fontSize: 15,
    fontWeight: "500",
    color: "#333",
    marginBottom: 4,
  },
  answerText: {
    fontSize: 14,
    color: "#666",
    fontStyle: "italic",
    marginLeft: 12,
  },
  // Danger Level Styles (copied from camera.tsx)
  dangerLevelSection: {
    marginBottom: 15,
  },
  diagnosisLabel: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 2,
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
    marginLeft: -8,
    borderWidth: 2,
    borderColor: "white",
  },
  dangerLevelIndicator: {
    position: "absolute" as const,
    width: 20,
    height: 20,
    borderRadius: 10,
    top: 0,
    marginLeft: -10,
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
