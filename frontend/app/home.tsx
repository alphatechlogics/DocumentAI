import { Button } from "@/components/ui/Button";
import { DualToneBackground } from "@/components/ui/DualToneBackground";
import { useRTL } from "@/src/context/CompleteRTLContext";
import { fetchPatientRecords } from "@/src/services/records";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import HistorySection, { HistoryItemType } from "./HistoryComponent";

export default function Home() {
  const router = useRouter();
  const { language, isRTL, toggleLanguage, t } = useRTL();

  const [historyItems, setHistoryItems] = useState<HistoryItemType[]>([]);

  useEffect(() => {
    const loadRecords = async () => {
      const records = await fetchPatientRecords();
      // Transform API records to HistoryItemType format
      const items = records.map((record: any) => ({
        id: record._id || Math.random().toString(),
        date: new Date(record.created_at).toLocaleDateString(),
        title: t("history.skinAnalysis"),
        image_url: record.image_url,
        description: record.diagnosis || t("history.noDiagnosis"),
        questions: record.questions || [],
      }));
      setHistoryItems(items);
    };

    loadRecords();
  }, [language]);

  // Show only first 3 items in home view
  const displayedItems = historyItems.slice(0, 3);

  const handleScanPress = () => {
    router.push("/camera");
  };

  const handleSymptomsQuizPress = () => {
    router.push("/symptoms");
  };

  const handleChatBotPress = () => {
    router.push("/chatbot");
  };

  // Get dynamic styles based on RTL
  const dynamicStyles = getDynamicStyles(isRTL);

  return (
    <DualToneBackground>
      <View style={styles.mainContainer}>
        {/* Top Section with Header and Buttons */}
        <View style={styles.topSection}>
          {/* Language Toggle Button */}
          <View
            style={[
              styles.languageToggleContainer,
              dynamicStyles.languageToggle,
            ]}
          >
            <TouchableOpacity
              style={styles.languageToggle}
              onPress={toggleLanguage}
              activeOpacity={0.7}
            >
              <View style={styles.toggleButton}>
                <Text
                  style={[
                    styles.toggleText,
                    language === "en" && styles.activeToggleText,
                  ]}
                >
                  EN
                </Text>
                <View style={styles.toggleDivider} />
                <Text
                  style={[
                    styles.toggleText,
                    language === "ar" && styles.activeToggleText,
                  ]}
                >
                  عربي
                </Text>
              </View>
            </TouchableOpacity>
          </View>

          <View style={[styles.header, dynamicStyles.header]}>
            <Text style={[styles.headerTitle, dynamicStyles.text]}>
              {t("app.title")}
            </Text>
            <Text style={[styles.headerSubtitle, dynamicStyles.text]}>
              {t("app.subtitle")}
            </Text>
          </View>

          {/* Centered Column of Action Buttons */}
          <View style={styles.centeredButtonColumn}>
            <Button
              title={t("button.scan")}
              onPress={handleScanPress}
              variant="primary"
              style={styles.button}
            />
            <View style={styles.buttonSpacing} />
            <Button
              title={t("button.symptoms")}
              onPress={handleSymptomsQuizPress}
              variant="primary"
              style={[styles.button, { borderRadius: 15 }]}
              disabled={true}
            />
            <View style={styles.buttonSpacing} />
            <Button
              title={t("button.chatbot")}
              onPress={handleChatBotPress}
              variant="primary"
              style={styles.button}
            />
          </View>
        </View>

        {/* Grey Background History Section */}
        <View style={styles.historyBackground}>
          <ScrollView style={styles.scrollContainer}>
            <HistorySection
              historyItems={displayedItems}
              allItems={historyItems}
            />
          </ScrollView>
        </View>
      </View>
    </DualToneBackground>
  );
}

const getDynamicStyles = (isRTL: boolean) =>
  StyleSheet.create({
    header: {
      alignItems: isRTL ? "flex-end" : "flex-start",
    },
    text: {
      textAlign: isRTL ? "right" : "left",
      writingDirection: isRTL ? "rtl" : "ltr",
    },
    languageToggle: {
      alignSelf: isRTL ? "flex-start" : "flex-end",
    },
  });

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
  },
  topSection: {
    height: "50%",
    justifyContent: "space-between",
    paddingTop: 48,
    paddingBottom: 20,
  },
  languageToggleContainer: {
    paddingHorizontal: 24,
    marginBottom: 10,
  },
  languageToggle: {
    alignSelf: "flex-end",
  },
  toggleButton: {
    flexDirection: "row",
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)",
    marginRight: 40,
  },
  toggleText: {
    color: "rgba(255, 255, 255, 0.7)",
    fontSize: 14,
    fontWeight: "600",
    paddingHorizontal: 8,
  },
  activeToggleText: {
    color: "#fff",
    fontWeight: "700",
  },
  toggleDivider: {
    width: 1,
    height: 16,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
  },
  header: {
    paddingHorizontal: 24,
    marginBottom: 5,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: "#fff",
  },
  headerSubtitle: {
    fontSize: 16,
    color: "#fff",
    marginTop: 4,
  },
  centeredButtonColumn: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  button: {
    height: 35,
    marginVertical: 2,
    shadowColor: "#d9d6d0",
    shadowOffset: { width: 2, height: 4 },
    shadowOpacity: 2,
    shadowRadius: 6,
    elevation: 12,
  },
  buttonSpacing: {
    height: 12,
  },
  historyBackground: {
    flex: 1,
    backgroundColor: "#3030d5e2",
    // borderTopLeftRadius: 20,
    // borderTopRightRadius: 20,
  },
  scrollContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
});
