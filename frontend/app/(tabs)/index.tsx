import {
  Text,
  View,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { StatusBar } from "expo-status-bar";

export default function Index() {
  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <StatusBar style="light" />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.logoContainer}>
          <View style={styles.logo}>
            <Text style={styles.logoText}>🏥</Text>
          </View>
          <Text style={styles.headerTitle}>DocumentAI </Text>
        </View>
      </View>

      {/* Main Content with space-around */}
      <View style={styles.mainContainer}>
        <View style={styles.contentWrapper}>
          {/* Input Field */}
          <TextInput
            style={styles.input}
            placeholder="How may I help you today?"
            placeholderTextColor="#999"
          />

          {/* Diagnosis Group */}
          <View style={styles.diagnosisGroup}>
            <TouchableOpacity style={styles.primaryButton}>
              <Text style={styles.primaryButtonText}>
                I want a Diagnosis 🩺
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.smallSecondaryButton}>
              <Text style={styles.smallSecondaryButtonText}>
                Diagnosis History
              </Text>
            </TouchableOpacity>
          </View>

          {/* Other Buttons */}
          <TouchableOpacity style={styles.primaryButton}>
            <Text style={styles.primaryButtonText}>I have a Question 💬</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.primaryButton}>
            <Text style={styles.primaryButtonText}>Chat With Me 💬</Text>
          </TouchableOpacity>

          {/* Contact Button */}
          <TouchableOpacity style={styles.smallContactButton}>
            <Text style={styles.smallContactButtonText}>contact us 📧</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  header: {
    backgroundColor: "#7C5FDC",
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  logoContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  logo: {
    width: 40,
    height: 40,
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  logoText: {
    fontSize: 24,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  mainContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  contentWrapper: {
    flex: 1,
    justifyContent: "space-around", // This creates equal space around all items
    paddingVertical: 80, // Small padding for breathing room
  },
  input: {
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 14,
    color: "#333",
    height: 50,
  },
  diagnosisGroup: {
    // No margins needed, space-around handles it
  },
  primaryButton: {
    backgroundColor: "#5E4AB4",
    borderRadius: 25,
    paddingVertical: 15,
    paddingHorizontal: 20,
    alignItems: "center",
    minHeight: 50,
    justifyContent: "center",
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },
  smallSecondaryButton: {
    backgroundColor: "#FFFFFF",
    borderRadius: 15,
    paddingVertical: 8,
    paddingHorizontal: 15,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#5E4AB4",
    alignSelf: "center",
    marginTop: 8, // Small gap below main diagnosis button
    width: "60%",
  },
  smallSecondaryButtonText: {
    color: "#5E4AB4",
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
  },
  smallContactButton: {
    backgroundColor: "#5E4AB4",
    borderRadius: 15, // Same border radius as Diagnosis History
    paddingVertical: 8, // Same padding as Diagnosis History
    paddingHorizontal: 25, // Slightly wider for contact text
    alignItems: "center",
    alignSelf: "center",
    minHeight: 35, // Same height as Diagnosis History
    justifyContent: "center",
  },
  smallContactButtonText: {
    color: "#FFFFFF",
    fontSize: 14, // Same font size as Diagnosis History
    fontWeight: "600",
  },
});
