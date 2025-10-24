import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Alert,
} from "react-native";
import { Button } from "@/components/ui/Button";
import { DualToneBackground } from "@/components/ui/DualToneBackground";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "@/src/context/AuthContext";
import { GlobalStyles } from "@/styles/global";
import { useRouter } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";

export default function SignUpPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { signup, state } = useAuth();
  const router = useRouter();
  const APP_ID = "2";
  const APP_NAME = "doctor-ai";
  const ROLE_ID = "58962cb7-9c11-4a7b-93f6-dfdfa20eae64";
  const handleSignUp = async () => {
    if (password !== confirmPassword) {
      Alert.alert("Error", "Passwords don't match");
      return;
    }
    try {
      await signup(name, email, password, APP_ID, APP_NAME, ROLE_ID);
    } catch (error) {
      // Error is already handled in the auth context
    }
  };

  const navigateToLogin = () => {
    router.push("/login");
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  return (
    <DualToneBackground>
      <SafeAreaView style={styles.container}>
        <View style={styles.formContainer}>
          <Text style={styles.title}>Create Account</Text>

          {state.error && <Text style={styles.errorText}>{state.error}</Text>}

          <TextInput
            style={styles.input}
            placeholder="Full Name"
            placeholderTextColor="#999"
            value={name}
            onChangeText={setName}
            autoComplete="name"
            importantForAutofill="yes"
            editable={!state.isLoading}
          />

          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor="#999"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            autoComplete="email"
            importantForAutofill="yes"
            editable={!state.isLoading}
          />

          <View style={styles.passwordContainer}>
            <TextInput
              style={styles.passwordInput}
              placeholder="Password"
              placeholderTextColor="#999"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              autoComplete="password"
              importantForAutofill="yes"
              editable={!state.isLoading}
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

          <View style={styles.passwordContainer}>
            <TextInput
              style={styles.passwordInput}
              placeholder="Confirm Password"
              placeholderTextColor="#999"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry={!showConfirmPassword}
              editable={!state.isLoading}
            />
            <TouchableOpacity
              style={styles.eyeIcon}
              onPress={toggleConfirmPasswordVisibility}
              activeOpacity={0.7}
            >
              <MaterialIcons
                name={showConfirmPassword ? "visibility" : "visibility-off"}
                size={24}
                color="#666"
              />
            </TouchableOpacity>
          </View>

          <Button
            title={state.isLoading ? "Creating account..." : "Sign Up"}
            onPress={handleSignUp}
            disabled={state.isLoading}
            variant="primary"
            style={[styles.button, GlobalStyles.buttonContainer]}
          />

          <View style={styles.loginContainer}>
            <Text style={styles.loginText}>Already have an account? </Text>
            <TouchableOpacity onPress={navigateToLogin} activeOpacity={0.7}>
              <Text style={styles.loginLink}>Login</Text>
            </TouchableOpacity>
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
    color: "#000",
    placeholderTextColor: "#999",
    ...Platform.select({
      android: {
        paddingVertical: 12,
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
    marginRight: -8,
  },
  button: {
    marginTop: 16,
    marginBottom: 12,
  },
  errorText: {
    color: "#FF3B30",
    marginBottom: 12,
    fontSize: 14,
    textAlign: "center",
  },
  loginContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 16,
  },
  loginText: {
    color: "#666",
    fontSize: 14,
  },
  loginLink: {
    color: "#7928CA",
    fontSize: 16,
    fontWeight: "600",
  },
});
