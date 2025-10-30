import { API_BASE_URL, API_ENDPOINTS, createHeaders } from "../config";
import {
  ChatMessage,
  ChatResponse,
  ChatHistoryItem,
  ApiResponse,
} from "../types";

class ChatService {
  /**
   * Send a message to the medical AI
   */
  async sendMessage(message: ChatMessage): Promise<ApiResponse<ChatResponse>> {
    try {
      const headers = await createHeaders();

      const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.CHAT}`, {
        method: "POST",
        headers: {
          ...headers,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(message),
      });

      if (!response.ok) {
        const error = await response.json();
        return {
          success: false,
          error: error.detail || "Failed to send message",
        };
      }

      const data = await response.json();
      return {
        success: true,
        data,
      };
    } catch (error) {
      console.error("Error sending message:", error);
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to send message",
      };
    }
  }

  /**
   * Get chat history
   */
  async getChatHistory(
    session_id?: string,
    patient_id?: string,
    limit: number = 50,
    skip: number = 0
  ): Promise<ApiResponse<ChatHistoryItem[]>> {
    try {
      const params = new URLSearchParams();
      if (session_id) params.append("session_id", session_id);
      if (patient_id) params.append("patient_id", patient_id);
      params.append("limit", limit.toString());
      params.append("skip", skip.toString());

      const headers = await createHeaders();

      const response = await fetch(
        `${API_BASE_URL}${API_ENDPOINTS.CHAT_HISTORY}?${params.toString()}`,
        { headers }
      );

      if (!response.ok) {
        const error = await response.json();
        return {
          success: false,
          error: error.detail || "Failed to fetch chat history",
        };
      }

      const data = await response.json();
      return {
        success: true,
        data,
      };
    } catch (error) {
      console.error("Error fetching chat history:", error);
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to fetch chat history",
      };
    }
  }

  /**
   * Delete chat session
   */
  async deleteChatSession(
    sessionId: string
  ): Promise<ApiResponse<{ message: string }>> {
    try {
      const headers = await createHeaders();

      const response = await fetch(
        `${API_BASE_URL}${API_ENDPOINTS.DELETE_CHAT_SESSION(sessionId)}`,
        {
          method: "DELETE",
          headers,
        }
      );

      if (!response.ok) {
        const error = await response.json();
        return {
          success: false,
          error: error.detail || "Failed to delete chat session",
        };
      }

      const data = await response.json();
      return {
        success: true,
        data,
      };
    } catch (error) {
      console.error("Error deleting chat session:", error);
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to delete chat session",
      };
    }
  }
}

export const chatService = new ChatService();
