// Medical Image Analysis Types
export interface DiagnosisResponse {
  diagnosis_english: string;
  diagnosis_arabic: string;
  confidence_score: number;
  findings: string[];
  recommendations?: string;
  image_type: string;
}

export interface StoredDiagnosisResponse extends DiagnosisResponse {
  _id: string;
  patient_id?: string;
  image_url: string;
  created_at: string;
}

export interface AnalyzeImageParams {
  file: {
    uri: string;
    name: string;
    type: string;
  };
  patient_id?: string;
}

// Chat Types
export interface ChatMessage {
  message: string;
  patient_id?: string;
  session_id?: string;
}

export interface ChatResponse {
  response_english: string;
  response_arabic: string;
  session_id: string;
  is_medical: boolean;
  confidence_score: number;
}

export interface ChatHistoryItem {
  _id: string;
  patient_id?: string;
  session_id: string;
  user_message: string;
  ai_response_english: string;
  ai_response_arabic: string;
  is_medical: boolean;
  confidence_score: number;
  created_at: string;
}

// Error Response
export interface ApiError {
  error: string;
  detail: string;
}

// API Response wrapper
export type ApiResponse<T> = {
  success: boolean;
  data?: T;
  error?: string;
};
