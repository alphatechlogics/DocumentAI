import React, { useState, useRef, useEffect } from "react";
import {
  View,
  StyleSheet,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Text } from "react-native-paper";
import { Ionicons } from "@expo/vector-icons";
import { chatService } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
  isArabic?: boolean;
}

export default function ChatScreen() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      text: "Hello! How can I help you today?",
      isUser: false,
      timestamp: new Date(),
    },
  ]);
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | undefined>(undefined);
  const flatListRef = useRef<FlatList>(null);
  const { state } = useAuth(); // Changed from destructuring user

  useEffect(() => {
    // Scroll to bottom when new messages are added
    if (messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  const handleSend = async () => {
    if (!inputText.trim()) return;

    const userMessage = inputText.trim();
    setInputText("");

    // Add user message to chat
    const newUserMessage: Message = {
      id: Date.now().toString(),
      text: userMessage,
      isUser: true,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, newUserMessage]);
    setIsLoading(true);

    try {
      // Call chat API - using state.user instead of user
      const result = await chatService.sendMessage({
        message: userMessage,
        patient_id: state.user?.email, // Using email as patient_id since your User type doesn't have userId
        session_id: sessionId,
      });

      if (result.success && result.data) {
        // Update session ID if new
        if (!sessionId) {
          setSessionId(result.data.session_id);
        }

        // Add AI response (English) to chat
        const aiMessage: Message = {
          id: (Date.now() + 1).toString(),
          text: result.data.response_english,
          isUser: false,
          timestamp: new Date(),
        };

        setMessages((prev) => [...prev, aiMessage]);

        // Optionally add Arabic response if needed
        if (result.data.response_arabic) {
          const aiMessageArabic: Message = {
            id: (Date.now() + 2).toString(),
            text: result.data.response_arabic,
            isUser: false,
            timestamp: new Date(),
            isArabic: true,
          };
          // Uncomment if you want to show Arabic response
          // setMessages((prev) => [...prev, aiMessageArabic]);
        }
      } else {
        // Show error message
        Alert.alert("Error", result.error || "Failed to send message");

        const errorMessage: Message = {
          id: (Date.now() + 1).toString(),
          text: "Sorry, I couldn't process your message. Please try again.",
          isUser: false,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, errorMessage]);
      }
    } catch (error) {
      console.error("Error sending message:", error);
      Alert.alert("Error", "Failed to send message. Please try again.");

      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: "Sorry, something went wrong. Please try again.",
        isUser: false,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const renderMessage = ({ item }: { item: Message }) => {
    if (item.isUser) {
      return (
        <View style={styles.userMessageContainer}>
          <View style={styles.userMessageBubble}>
            <Text style={styles.userMessageText}>{item.text}</Text>
          </View>
        </View>
      );
    } else {
      return (
        <View style={styles.aiMessageContainer}>
          <View style={styles.aiIcon}>
            <Ionicons name="medical" size={20} color="#FFFFFF" />
          </View>
          <View style={styles.aiMessageBubble}>
            <Text
              style={[styles.aiMessageText, item.isArabic && styles.arabicText]}
            >
              {item.text}
            </Text>
          </View>
        </View>
      );
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>
          AI Doctor - Diagnosis & Treatment
        </Text>
      </View>

      {/* Messages List */}
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.messagesList}
        showsVerticalScrollIndicator={false}
      />

      {/* Loading Indicator */}
      {isLoading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color="#7C5FDC" />
          <Text style={styles.loadingText}>AI is typing...</Text>
        </View>
      )}

      {/* Input Area */}
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="What would you like to ask?"
          value={inputText}
          onChangeText={setInputText}
          multiline
          maxLength={500}
          editable={!isLoading}
        />
        <TouchableOpacity
          style={[
            styles.sendButton,
            (!inputText.trim() || isLoading) && styles.sendButtonDisabled,
          ]}
          onPress={handleSend}
          disabled={!inputText.trim() || isLoading}
        >
          <Ionicons
            name="send"
            size={24}
            color={!inputText.trim() || isLoading ? "#CCC" : "#7C5FDC"}
          />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  header: {
    backgroundColor: "#7C5FDC",
    paddingVertical: 15,
    paddingHorizontal: 20,
    paddingTop: 50,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#FFFFFF",
    textAlign: "center",
  },
  messagesList: {
    paddingHorizontal: 15,
    paddingVertical: 20,
  },
  userMessageContainer: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginBottom: 15,
  },
  userMessageBubble: {
    backgroundColor: "#0084FF",
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 10,
    maxWidth: "75%",
  },
  userMessageText: {
    color: "#FFFFFF",
    fontSize: 15,
  },
  aiMessageContainer: {
    flexDirection: "row",
    marginBottom: 15,
    alignItems: "flex-start",
  },
  aiIcon: {
    width: 35,
    height: 35,
    borderRadius: 17.5,
    backgroundColor: "#7C5FDC",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  aiMessageBubble: {
    backgroundColor: "#7C5FDC",
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 10,
    maxWidth: "75%",
  },
  aiMessageText: {
    color: "#FFFFFF",
    fontSize: 15,
    lineHeight: 20,
  },
  arabicText: {
    textAlign: "right",
    writingDirection: "rtl",
  },
  inputContainer: {
    flexDirection: "row",
    padding: 10,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#E0E0E0",
    alignItems: "center",
  },
  input: {
    flex: 1,
    backgroundColor: "#F5F5F5",
    borderRadius: 25,
    paddingHorizontal: 15,
    paddingVertical: 10,
    fontSize: 15,
    maxHeight: 100,
    marginRight: 10,
  },
  sendButton: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    justifyContent: "center",
    alignItems: "center",
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  loadingText: {
    marginLeft: 10,
    color: "#666",
    fontSize: 14,
  },
});
