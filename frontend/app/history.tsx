import { DualToneBackground } from "@/components/ui/DualToneBackground";
import { useRTL } from "@/src/context/CompleteRTLContext";
import { useLocalSearchParams } from "expo-router";
import React from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { HistorySection } from "./HistoryComponent";

export default function FullHistoryPage() {
  const { items } = useLocalSearchParams();
  const { isRTL, t } = useRTL();
  const historyItems = items ? JSON.parse(items as string) : [];

  // Filter items to show most recent first
  const sortedItems = [...historyItems].sort(
    (a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime()
  );

  const dynamicStyles = getDynamicStyles(isRTL);

  return (
    <DualToneBackground>
      <ScrollView contentContainerStyle={styles.container}>
        {sortedItems.length > 0 ? (
          <HistorySection
            historyItems={sortedItems}
            allItems={sortedItems}
            showHeader={false}
          />
        ) : (
          <View style={styles.emptyState}>
            <Text style={[styles.emptyText, dynamicStyles.text]}>
              {t("history.noRecordsFound")}
            </Text>
            <Text style={[styles.emptySubtext, dynamicStyles.text]}>
              {t("history.recordsSubtext")}
            </Text>
          </View>
        )}
      </ScrollView>
    </DualToneBackground>
  );
}

const getDynamicStyles = (isRTL: boolean) =>
  StyleSheet.create({
    text: {
      textAlign: isRTL ? "right" : "left",
      writingDirection: isRTL ? "rtl" : "ltr",
    },
  });

const styles = StyleSheet.create({
  container: {
    paddingBottom: 30,
    flexGrow: 1,
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    marginTop: "40%",
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "500",
    color: "#334155",
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: "#64748b",
    textAlign: "center",
  },
});
