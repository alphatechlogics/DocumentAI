// components/HistoryComponent.tsx
import { useRTL } from "@/src/context/CompleteRTLContext";
import { useRouter } from "expo-router";
import React from "react";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";

export interface HistoryItemType {
  id: string;
  date: string;
  title: string;
  image_url?: string;
  description?: string;
  questions?: Array<{ question: string; answer: string }>;
}

interface HistoryItemProps {
  item: HistoryItemType;
}

interface HistorySectionProps {
  historyItems: HistoryItemType[];
  allItems?: HistoryItemType[];
  showHeader?: boolean;
}

export const HistoryItem: React.FC<HistoryItemProps> = ({ item }) => {
  const router = useRouter();
  const { isRTL, t } = useRTL();

  const handleItemPress = () => {
    router.push({
      pathname: "/details",
      params: {
        id: item.id,
        image_url: item.image_url || "",
        description: item.description || "",
        date: item.date || "",
        title: item.title || t("history.medicalRecord"),
        questions: JSON.stringify(item.questions || []),
      },
    });
  };

  // Determine what to show in the preview
  const previewText = item.description
    ? item.description
    : item.questions?.length
    ? `${item.questions.length} ${t("history.symptomQuestions")}`
    : t("history.noDetails");

  const dynamicStyles = getDynamicStyles(isRTL);

  return (
    <TouchableOpacity style={styles.historyBox} onPress={handleItemPress}>
      <View style={[styles.boxContent, dynamicStyles.boxContent]}>
        {item.image_url ? (
          <Image source={{ uri: item.image_url }} style={styles.boxImage} />
        ) : (
          <View style={[styles.boxImage, { backgroundColor: "#e2e8f0" }]} />
        )}
        <View style={[styles.textContainer, dynamicStyles.textContainer]}>
          <Text style={[styles.boxTitle, dynamicStyles.text]}>
            {item.title || t("history.medicalRecord")}
          </Text>
          <Text
            style={[styles.boxDescription, dynamicStyles.text]}
            numberOfLines={2}
            ellipsizeMode="tail"
          >
            {previewText}
          </Text>
          {item.date && (
            <Text style={[styles.boxDate, dynamicStyles.text]}>
              {item.date}
            </Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

export const HistorySection: React.FC<HistorySectionProps> = ({
  historyItems,
  allItems = historyItems,
  showHeader = true,
}) => {
  const router = useRouter();
  const { isRTL, t } = useRTL();

  const handleViewAll = () => {
    router.push({
      pathname: "/history",
      params: {
        items: JSON.stringify(allItems),
      },
    });
  };

  const dynamicStyles = getDynamicStyles(isRTL);

  return (
    <View style={styles.historySection}>
      {showHeader && (
        <View style={[styles.sectionHeader, dynamicStyles.sectionHeader]}>
          <Text style={[styles.sectionTitle, dynamicStyles.text]}>
            {t("history.title")}
          </Text>

          <TouchableOpacity onPress={handleViewAll}>
            <Text style={[styles.viewAll, dynamicStyles.text]}>
              {t("history.viewAll")} ({allItems.length})
            </Text>
          </TouchableOpacity>
        </View>
      )}
      {historyItems.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={[styles.emptyText, dynamicStyles.text]}>
            {t("history.empty")}
          </Text>
        </View>
      ) : (
        historyItems.map((item) => <HistoryItem key={item.id} item={item} />)
      )}
    </View>
  );
};

const getDynamicStyles = (isRTL: boolean) =>
  StyleSheet.create({
    sectionHeader: {
      flexDirection: isRTL ? "row-reverse" : "row",
    },
    boxContent: {
      flexDirection: isRTL ? "row-reverse" : "row",
    },
    textContainer: {
      marginLeft: isRTL ? 0 : 12,
      marginRight: isRTL ? 12 : 0,
    },
    text: {
      textAlign: isRTL ? "right" : "left",
      writingDirection: isRTL ? "rtl" : "ltr",
    },
  });

const styles = StyleSheet.create({
  historySection: {
    paddingHorizontal: 16,
    marginTop: 20,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#0f172a",
  },
  viewAll: {
    color: "#4361ee",
    fontWeight: "500",
  },
  historyBox: {
    backgroundColor: "#fff",
    borderRadius: 8,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
    overflow: "hidden",
  },
  boxContent: {
    flexDirection: "row",
    alignItems: "center",
    padding: 8,
  },
  boxImage: {
    width: 70,
    height: 70,
    borderRadius: 4,
    backgroundColor: "#f1f5f9",
  },
  textContainer: {
    flex: 1,
    marginLeft: 12,
    justifyContent: "space-between",
  },
  boxTitle: {
    fontSize: 16,
    fontWeight: "500",
    color: "#0f172a",
    marginBottom: 4,
  },
  boxDescription: {
    fontSize: 14,
    color: "#334155",
    lineHeight: 20,
    marginBottom: 4,
  },
  boxDate: {
    fontSize: 12,
    color: "#64748b",
  },
  emptyContainer: {
    paddingVertical: 40,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 16,
    color: "#64748b",
    fontStyle: "italic",
  },
});

export default HistorySection;
