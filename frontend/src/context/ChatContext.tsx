// src/context/ChatContext.tsx
import React, { createContext, useContext, useReducer, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  sendChatMessage,
  getUserChatHistory,
  ChatHistory,
} from "../services/chatbot";

type Message = {
  id: string;
  text: string;
  sender: "user" | "bot";
  timestamp?: string;
};

type ChatState = {
  messages: Message[];
  isLoading: boolean;
  error: string | null;
  isLoadingHistory: boolean;
  currentUserId: string | null; // Track current user
};

type ChatAction =
  | { type: "SEND_MESSAGE"; payload: string }
  | { type: "RECEIVE_MESSAGE"; payload: string }
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "SET_ERROR"; payload: string }
  | { type: "LOAD_HISTORY"; payload: Message[] }
  | { type: "SET_LOADING_HISTORY"; payload: boolean }
  | { type: "CLEAR_MESSAGES" }
  | { type: "SET_USER_ID"; payload: string | null };

const initialState: ChatState = {
  messages: [],
  isLoading: false,
  error: null,
  isLoadingHistory: false,
  currentUserId: null,
};

const ChatContext = createContext<{
  state: ChatState;
  sendMessage: (text: string) => Promise<void>;
  clearError: () => void;
  loadChatHistory: () => Promise<void>;
  clearMessages: () => void;
  refreshForNewUser: () => Promise<void>; // New method for user change
}>({
  state: initialState,
  sendMessage: async () => {},
  clearError: () => {},
  loadChatHistory: async () => {},
  clearMessages: () => {},
  refreshForNewUser: async () => {},
});

const chatReducer = (state: ChatState, action: ChatAction): ChatState => {
  switch (action.type) {
    case "SEND_MESSAGE":
      return {
        ...state,
        messages: [
          ...state.messages,
          {
            id: Date.now().toString(),
            text: action.payload,
            sender: "user",
            timestamp: new Date().toISOString(),
          },
        ],
        isLoading: true,
        error: null,
      };
    case "RECEIVE_MESSAGE":
      return {
        ...state,
        messages: [
          ...state.messages,
          {
            id: (Date.now() + 1).toString(),
            text: action.payload,
            sender: "bot",
            timestamp: new Date().toISOString(),
          },
        ],
        isLoading: false,
      };
    case "SET_LOADING":
      return {
        ...state,
        isLoading: action.payload,
      };
    case "SET_ERROR":
      return {
        ...state,
        isLoading: false,
        error: action.payload,
      };
    case "LOAD_HISTORY":
      return {
        ...state,
        messages: action.payload,
        isLoadingHistory: false,
      };
    case "SET_LOADING_HISTORY":
      return {
        ...state,
        isLoadingHistory: action.payload,
      };
    case "CLEAR_MESSAGES":
      return {
        ...state,
        messages: [],
        error: null,
      };
    case "SET_USER_ID":
      return {
        ...state,
        currentUserId: action.payload,
        // Clear messages when user changes
        messages: action.payload !== state.currentUserId ? [] : state.messages,
        error: null,
      };
    default:
      return state;
  }
};

// Helper function to convert chat history to messages
const convertChatHistoryToMessages = (
  chatHistory: ChatHistory[]
): Message[] => {
  const messages: Message[] = [];

  // Sort by creation date to maintain chronological order
  const sortedHistory = chatHistory.sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );

  sortedHistory.forEach((chat, index) => {
    // Add user message
    messages.push({
      id: `user-${chat.id || index}`,
      text: chat.question,
      sender: "user",
      timestamp: chat.createdAt,
    });

    // Add bot message
    messages.push({
      id: `bot-${chat.id || index}`,
      text: chat.answer,
      sender: "bot",
      timestamp: chat.createdAt,
    });
  });

  return messages;
};

export const ChatProvider = ({ children }: { children: React.ReactNode }) => {
  const [state, dispatch] = useReducer(chatReducer, initialState);

  // Check for user changes and load appropriate chat history
  useEffect(() => {
    const checkUserAndLoadHistory = async () => {
      try {
        const userId = await AsyncStorage.getItem("userId");

        // If user ID changed, update state and load new history
        if (userId !== state.currentUserId) {
          dispatch({ type: "SET_USER_ID", payload: userId });

          if (userId) {
            // Load chat history for the new user
            await loadChatHistory();
          }
        }
      } catch (error) {
        console.error("Error checking user ID:", error);
      }
    };

    checkUserAndLoadHistory();
  }, []); // Only run on mount

  // Listen for storage changes (when user signs in/out)
  useEffect(() => {
    let interval: NodeJS.Timeout;

    const checkUserChanges = async () => {
      try {
        const userId = await AsyncStorage.getItem("userId");

        if (userId !== state.currentUserId) {
          dispatch({ type: "SET_USER_ID", payload: userId });

          if (userId) {
            await loadChatHistory();
          }
        }
      } catch (error) {
        console.error("Error checking user changes:", error);
      }
    };

    // Check every 2 seconds for user changes
    interval = setInterval(checkUserChanges, 2000);

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [state.currentUserId]);

  const loadChatHistory = async () => {
    try {
      dispatch({ type: "SET_LOADING_HISTORY", payload: true });

      const chatHistory = await getUserChatHistory(false); // Don't include deleted chats
      const messages = convertChatHistoryToMessages(chatHistory);

      dispatch({ type: "LOAD_HISTORY", payload: messages });
    } catch (error) {
      console.error("Failed to load chat history:", error);
      dispatch({
        type: "SET_ERROR",
        payload: "Failed to load chat history",
      });
      dispatch({ type: "SET_LOADING_HISTORY", payload: false });
    }
  };

  const refreshForNewUser = async () => {
    try {
      const userId = await AsyncStorage.getItem("userId");
      dispatch({ type: "SET_USER_ID", payload: userId });

      if (userId) {
        await loadChatHistory();
      } else {
        dispatch({ type: "CLEAR_MESSAGES" });
      }
    } catch (error) {
      console.error("Error refreshing for new user:", error);
      dispatch({ type: "CLEAR_MESSAGES" });
    }
  };

  const sendMessage = async (text: string) => {
    if (!text.trim() || state.isLoading) return;

    dispatch({ type: "SEND_MESSAGE", payload: text });

    try {
      // Convert existing messages to API format (exclude the just-added user message)
      const chatHistory = state.messages.map((msg) => ({
        role: msg.sender === "user" ? "user" : "assistant",
        content: msg.text,
      }));

      const response = await sendChatMessage(text, chatHistory);

      dispatch({
        type: "RECEIVE_MESSAGE",
        payload: response.reply || response.diagnosis || "No response received",
      });
    } catch (error) {
      dispatch({
        type: "SET_ERROR",
        payload:
          error instanceof Error ? error.message : "Failed to send message",
      });
    }
  };

  const clearError = () => {
    dispatch({ type: "SET_ERROR", payload: null });
  };

  const clearMessages = () => {
    dispatch({ type: "CLEAR_MESSAGES" });
  };

  return (
    <ChatContext.Provider
      value={{
        state,
        sendMessage,
        clearError,
        loadChatHistory,
        clearMessages,
        refreshForNewUser,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error("useChat must be used within a ChatProvider");
  }
  return context;
};
