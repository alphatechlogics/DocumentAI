import AsyncStorage from "@react-native-async-storage/async-storage";

// API Base URL - update this with your actual backend URL
export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL || "http://localhost:8000";

// API Endpoints
export const API_ENDPOINTS = {
  // Medical Image Analysis
  ANALYZE: "/analyze",
  ANALYZE_AND_STORE: "/analyze-and-store",
  RECORDS: "/records",
  RECORD_BY_ID: (id: string) => `/records/${id}`,
  DELETE_RECORD: (id: string) => `/records/${id}`,

  // Chat
  CHAT: "/chat",
  CHAT_HISTORY: "/chat/history",
  DELETE_CHAT_SESSION: (sessionId: string) => `/chat/history/${sessionId}`,

  // Health
  HEALTH: "/health",
  ROOT: "/",
} as const;

// Get auth token from storage
export const getAuthToken = async (): Promise<string | null> => {
  try {
    const token = await AsyncStorage.getItem("token");
    return token;
  } catch (error) {
    console.error("Error getting auth token:", error);
    return null;
  }
};

// Create headers with auth token
export const createHeaders = async (
  includeAuth: boolean = true
): Promise<HeadersInit> => {
  const headers: HeadersInit = {
    Accept: "application/json",
  };

  if (includeAuth) {
    const token = await getAuthToken();
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
  }

  return headers;
};

// Create multipart headers for file uploads
export const createMultipartHeaders = async (): Promise<HeadersInit> => {
  const token = await getAuthToken();
  const headers: HeadersInit = {};

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  return headers;
};
