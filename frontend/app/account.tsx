import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Platform,
  StatusBar,
  ScrollView,
} from "react-native";
import { AntDesign } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { DualToneBackground } from "@/components/ui/DualToneBackground";
import { Button } from "@/components/ui/Button";
import Login from "./(auth)/login";

interface NavBarProps {
  title?: string;
  onBackPress?: () => void;
  showBackButton?: boolean;
}

export default function NavBar({
  title = "Doctor AI",
  onBackPress,
  showBackButton = false,
}: NavBarProps) {
  const router = useRouter();

  const handleSignUp = () => {
    console.log("Navigate to sign up");
    router.push("/signup");
  };

  const handleLogin = () => {
    console.log("Navigate to login");
    router.push("/login");
  };

  return (
    <DualToneBackground>
      <SafeAreaView style={styles.safeArea}>
        {/* Navbar at the top */}
        <View style={styles.navBar}>
          <View style={styles.navBarContent}>
            {showBackButton && (
              <TouchableOpacity
                style={styles.backButton}
                onPress={onBackPress || (() => router.back())}
              >
                <AntDesign name="arrowleft" size={24} color="white" />
              </TouchableOpacity>
            )}

            <Text style={styles.title}>{title}</Text>

            <TouchableOpacity style={styles.accountButton}>
              <AntDesign name="user" size={24} color="white" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Main Content */}
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <View style={styles.accountInfo}>
            {/* Welcome Section */}
            <View style={styles.welcomeContainer}>
              <Text style={styles.welcomeTitle}>Welcome to Doctor AI</Text>
              <Text style={styles.welcomeSubtitle}>
                Your personal health assistant
              </Text>
            </View>

            {/* Buttons Container */}
            <View style={styles.buttonContainer}>
              {/* // Update your Login button: */}
              <Button
                title="Login"
                onPress={handleLogin} // Connect the navigation
                variant="primary"
                style={styles.button}
              />
            </View>
            <View style={styles.buttonContainer}>
              <Button
                title="SignUp"
                onPress={handleSignUp}
                variant="primary"
                style={styles.button}
              />
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </DualToneBackground>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
  },
  navBar: {
    backgroundColor: "black",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#333",
  },
  navBarContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  backButton: {
    padding: 8,
  },
  title: {
    color: "white",
    fontSize: 20,
    fontWeight: "bold",
    flex: 1,
    textAlign: "center",
  },
  accountButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: "rgba(50, 50, 50, 0.7)",
    // width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  scrollContainer: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  welcomeContainer: {
    alignItems: "center",
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  accountInfo: {
    display: "flex",
    // alignItems: "center",
    justifyContent: "center",
    flexDirection: "column",
    margin: "auto",
  },
  welcomeTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 8,
    textAlign: "center",
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: "#fff",
    textAlign: "center",
  },
  buttonContainer: {
    paddingHorizontal: 82,
    // marginBottom: 20,
  },
  button: {
    marginBottom: 16,
    width: "100%",
  },
});
