import { useAuth } from "@/lib/auth-context";
import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  View,
  ScrollView,
  Alert,
} from "react-native";
import { Button, Text, TextInput, useTheme } from "react-native-paper";

export default function AuthScreen() {
  const [isSignUp, setIsSignUp] = useState<boolean>(false);
  const [name, setName] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  const theme = useTheme();
  const { login, signup, state } = useAuth();

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleAuth = async () => {
    setError(null);

    // Validation
    if (!email || !password) {
      setError("Please fill in all fields.");
      return;
    }

    if (!validateEmail(email)) {
      setError("Please enter a valid email address.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    if (isSignUp) {
      if (!name) {
        setError("Please enter your name.");
        return;
      }

      if (password !== confirmPassword) {
        setError("Passwords do not match.");
        return;
      }
    }

    try {
      if (isSignUp) {
        await signup(name, email, password);
        Alert.alert(
          "Success",
          "Account created successfully! Welcome to DocumentAI.",
          [{ text: "OK" }]
        );
      } else {
        await login(email, password);
      }
      // Navigation is handled automatically by auth context
    } catch (err: any) {
      setError(
        err.message || "An unexpected error occurred. Please try again."
      );
      console.error("Auth error:", err);
    }
  };

  const handleSwitchMode = () => {
    setIsSignUp((prev) => !prev);
    setError(null);
    setName("");
    setEmail("");
    setPassword("");
    setConfirmPassword("");
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.content}>
          <Text style={styles.title} variant="headlineMedium">
            {isSignUp ? "Create Account" : "Welcome Back"}
          </Text>
          <Text style={styles.subtitle} variant="bodyMedium">
            {isSignUp
              ? "Sign up to get started with DocumentAI"
              : "Sign in to continue to DocumentAI"}
          </Text>

          {isSignUp && (
            <TextInput
              label="Full Name"
              value={name}
              autoCapitalize="words"
              placeholder="John Doe"
              mode="outlined"
              style={styles.input}
              onChangeText={setName}
              disabled={state.isLoading}
            />
          )}

          <TextInput
            label="Email"
            value={email}
            autoCapitalize="none"
            keyboardType="email-address"
            placeholder="example@gmail.com"
            mode="outlined"
            style={styles.input}
            onChangeText={setEmail}
            disabled={state.isLoading}
          />

          <TextInput
            label="Password"
            value={password}
            autoCapitalize="none"
            mode="outlined"
            secureTextEntry
            placeholder="Enter your password"
            style={styles.input}
            onChangeText={setPassword}
            disabled={state.isLoading}
          />

          {isSignUp && (
            <TextInput
              label="Confirm Password"
              value={confirmPassword}
              autoCapitalize="none"
              mode="outlined"
              secureTextEntry
              placeholder="Confirm your password"
              style={styles.input}
              onChangeText={setConfirmPassword}
              disabled={state.isLoading}
            />
          )}

          {(error || state.error) && (
            <Text style={[styles.errorText, { color: theme.colors.error }]}>
              {error || state.error}
            </Text>
          )}

          <Button
            mode="contained"
            style={styles.button}
            onPress={handleAuth}
            loading={state.isLoading}
            disabled={state.isLoading}
          >
            {isSignUp ? "Sign Up" : "Sign In"}
          </Button>

          <Button
            mode="text"
            onPress={handleSwitchMode}
            style={styles.switchModeButton}
            disabled={state.isLoading}
          >
            {isSignUp
              ? "Already have an account? Sign In"
              : "Don't have an account? Sign Up"}
          </Button>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    padding: 20,
    justifyContent: "center",
  },
  title: {
    textAlign: "center",
    marginBottom: 8,
    fontWeight: "bold",
  },
  subtitle: {
    textAlign: "center",
    marginBottom: 32,
    color: "#666",
  },
  input: {
    marginBottom: 16,
  },
  button: {
    marginTop: 8,
    paddingVertical: 6,
  },
  switchModeButton: {
    marginTop: 16,
  },
  errorText: {
    marginBottom: 16,
    textAlign: "center",
  },
});
