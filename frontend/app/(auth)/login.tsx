import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from "react-native";
import { Button } from "@/components/ui/Button";
import { DualToneBackground } from "@/components/ui/DualToneBackground";
import { SafeAreaView } from "react-native-safe-area-context";
import { Link } from "expo-router";
import { GlobalStyles } from "@/styles/global";
import { useAuth } from "@/src/context/AuthContext";
import { MaterialIcons } from "@expo/vector-icons";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const { login, state } = useAuth();
  const APP_ID = "2";
  const handleLogin = async () => {
    try {
      await login(email, password, APP_ID);
    } catch (error) {
      // Error is already handled in the auth context
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <DualToneBackground>
      <SafeAreaView style={styles.container}>
        <View style={styles.formContainer}>
          <Text style={styles.title}>Welcome to Doctor AI</Text>

          {state.error && <Text style={styles.errorText}>{state.error}</Text>}

          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor="#999"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            autoCorrect={false}
            editable={!state.isLoading}
            importantForAutofill="yes"
            autoComplete="email"
          />

          <View style={styles.passwordContainer}>
            <TextInput
              style={styles.passwordInput}
              placeholder="Password"
              placeholderTextColor="#999"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              editable={!state.isLoading}
              importantForAutofill="yes"
              autoComplete="password"
            />
            <TouchableOpacity
              style={styles.eyeIcon}
              onPress={togglePasswordVisibility}
              activeOpacity={0.7}
            >
              <MaterialIcons
                name={showPassword ? "visibility" : "visibility-off"}
                size={24}
                color="#666"
              />
            </TouchableOpacity>
          </View>

          <Button
            title={state.isLoading ? "Signing In..." : "Login"}
            onPress={handleLogin}
            disabled={state.isLoading}
            variant="primary"
            style={[styles.button, GlobalStyles.buttonContainer]}
          />

          <View style={styles.signupContainer}>
            <Text style={styles.signupText}>Don't have an account? </Text>
            <Link href="/signup" asChild>
              <TouchableOpacity activeOpacity={0.7}>
                <Text style={styles.signupLink}>Sign up</Text>
              </TouchableOpacity>
            </Link>
          </View>
        </View>
      </SafeAreaView>
    </DualToneBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
  },
  errorText: {
    color: "#FF3B30",
    marginBottom: 12,
    fontSize: 14,
    textAlign: "center",
  },
  formContainer: {
    padding: 24,
    marginHorizontal: 20,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 24,
    textAlign: "center",
  },
  input: {
    height: 50,
    borderColor: "#ddd",
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    marginBottom: 16,
    backgroundColor: "#fff",
    fontSize: 16,
    color: "#000", // Ensure text color contrasts with placeholder
    placeholderTextColor: "#999",
    ...Platform.select({
      android: {
        paddingVertical: 12, // Helps with some Android rendering issues
      },
    }),
  },
  passwordContainer: {
    position: "relative",
    marginBottom: 16,
  },
  passwordInput: {
    height: 50,
    borderColor: "#ddd",
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    backgroundColor: "#fff",
    fontSize: 16,
    paddingRight: 50,
    color: "#000",
    placeholderTextColor: "#999",
    ...Platform.select({
      android: {
        paddingVertical: 12,
      },
    }),
  },
  eyeIcon: {
    position: "absolute",
    right: 16,
    top: 13,
    padding: 8,
    marginRight: -8, // Better touch area
  },
  button: {
    marginTop: 8,
    marginBottom: 12,
  },
  signupContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 16,
  },
  signupText: {
    color: "#666",
    fontSize: 14,
  },
  signupLink: {
    color: "#7928CA",
    fontSize: 16,
    fontWeight: "600",
  },
});
