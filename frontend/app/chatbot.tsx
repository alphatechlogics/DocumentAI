// app/chatbot.tsx
import React, { useRef, useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  FlatList,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ActivityIndicator,
  Keyboard,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { DualToneBackground } from "@/components/ui/DualToneBackground";
import { useChat } from "@/src/context/ChatContext";

interface Message {
  id: string;
  text: string;
  sender: "user" | "bot";
  timestamp?: string;
}

export default function ChatBotScreen() {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const { state, sendMessage, clearError, loadChatHistory, clearMessages } =
    useChat();
  const flatListRef = useRef<FlatList>(null);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [keyboardVisible, setKeyboardVisible] = useState(false);

  // Add keyboard listeners
  useEffect(() => {
    const keyboardWillShowListener = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow",
      (e) => {
        setKeyboardVisible(true);
        setKeyboardHeight(e.endCoordinates.height);
      }
    );

    const keyboardWillHideListener = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide",
      () => {
        setKeyboardVisible(false);
        setKeyboardHeight(0);
      }
    );

    return () => {
      keyboardWillShowListener.remove();
      keyboardWillHideListener.remove();
    };
  }, []);

  // Auto-scroll when new messages arrive
  useEffect(() => {
    if (state.messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [state.messages]);

  const handleSend = async () => {
    if (!message.trim()) return;

    try {
      await sendMessage(message);
      setMessage("");
    } catch (error) {
      Alert.alert("Error", "Failed to send message. Please try again.", [
        { text: "OK", onPress: clearError },
      ]);
    }
  };

  const handleRefreshHistory = async () => {
    try {
      await loadChatHistory();
    } catch (error) {
      Alert.alert("Error", "Failed to refresh chat history.", [{ text: "OK" }]);
    }
  };

  const handleClearChat = () => {
    Alert.alert(
      "Clear Chat",
      "Are you sure you want to clear all messages? This will only clear the current session, not your saved history.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Clear", style: "destructive", onPress: clearMessages },
      ]
    );
  };

  const renderMessageItem = ({ item }: { item: Message }) => (
    <View
      style={[
        styles.messageBubble,
        item.sender === "user" ? styles.userBubble : styles.botBubble,
      ]}
    >
      <Text
        style={[
          styles.messageText,
          item.sender === "user" ? styles.userText : styles.botText,
        ]}
      >
        {item.text}
      </Text>
    </View>
  );

  const renderEmptyComponent = () => (
    <View style={styles.emptyContainer}>
      {state.isLoadingHistory ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4361ee" />
          <Text style={styles.loadingText}>Loading your chat history...</Text>
        </View>
      ) : (
        <Text style={styles.emptyText}>
          Start a conversation! Your messages will be saved automatically.
        </Text>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <DualToneBackground>
        <KeyboardAvoidingView
          style={styles.container}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
        >
          <View
            style={[
              styles.messageListContainer,
              keyboardVisible &&
                Platform.OS === "android" && {
                  paddingBottom: keyboardHeight,
                },
            ]}
          >
            {state.error && (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{state.error}</Text>
                <TouchableOpacity
                  onPress={clearError}
                  style={styles.dismissButton}
                >
                  <Text style={styles.dismissText}>Dismiss</Text>
                </TouchableOpacity>
              </View>
            )}

            <FlatList
              ref={flatListRef}
              data={state.messages}
              renderItem={renderMessageItem}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.messagesContainer}
              onContentSizeChange={() =>
                flatListRef.current?.scrollToEnd({ animated: true })
              }
              onLayout={() =>
                flatListRef.current?.scrollToEnd({ animated: true })
              }
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={renderEmptyComponent}
            />
          </View>

          <View
            style={[
              styles.inputContainer,
              keyboardVisible &&
                Platform.OS === "android" && {
                  position: "absolute",
                  bottom: keyboardHeight,
                  left: 0,
                  right: 0,
                },
            ]}
          >
            <TextInput
              style={styles.input}
              value={message}
              onChangeText={setMessage}
              placeholder="Type a message..."
              placeholderTextColor="#94a3b8"
              multiline
              maxLength={500}
              editable={!state.isLoading}
              onSubmitEditing={handleSend}
              returnKeyType="send"
              blurOnSubmit={false}
            />
            <TouchableOpacity
              style={[
                styles.sendButton,
                (state.isLoading || !message.trim()) && styles.disabledButton,
              ]}
              onPress={handleSend}
              disabled={state.isLoading || !message.trim()}
            >
              {state.isLoading ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text style={styles.sendButtonText}>Send</Text>
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </DualToneBackground>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
  },
  messageListContainer: {
    flex: 1,
  },
  messagesContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    paddingBottom: 80, // Extra padding to ensure messages aren't hidden behind the input
  },
  messageBubble: {
    padding: 12,
    borderRadius: 16,
    marginVertical: 4,
    maxWidth: "80%",
  },
  userBubble: {
    backgroundColor: "#4361ee",
    alignSelf: "flex-end",
    borderBottomRightRadius: 4,
  },
  botBubble: {
    backgroundColor: "#f1f5f9",
    alignSelf: "flex-start",
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 16,
  },
  userText: {
    color: "#ffffff",
  },
  botText: {
    color: "#1e293b",
  },
  inputContainer: {
    flexDirection: "row",
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.05)",
    backgroundColor: "rgba(255,255,255,0.95)",
    width: "100%",
    zIndex: 1000,
  },
  input: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 16,
    fontSize: 16,
    maxHeight: 100,
    color: "#0f172a",
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  sendButton: {
    backgroundColor: "#000000",
    width: 60,
    height: 38,
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
  },
  disabledButton: {
    opacity: 1,
  },
  sendButtonText: {
    color: "#ffffff",
    fontWeight: "600",
  },
  errorContainer: {
    backgroundColor: "#fee2e2",
    padding: 12,
    marginHorizontal: 16,
    borderRadius: 8,
    marginBottom: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  errorText: {
    color: "#dc2626",
    fontSize: 14,
    flex: 1,
  },
  dismissButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  dismissText: {
    color: "#dc2626",
    fontWeight: "600",
    fontSize: 14,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 40,
  },
  emptyText: {
    color: "#000000",
    fontSize: 16,
    textAlign: "center",
  },
  loadingContainer: {
    alignItems: "center",
  },
  loadingText: {
    color: "#000000",
    fontSize: 16,
    marginTop: 12,
    textAlign: "center",
  },
});
