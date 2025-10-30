import {
  API_BASE_URL,
  API_ENDPOINTS,
  createMultipartHeaders,
  createHeaders,
} from "../config";
import {
  DiagnosisResponse,
  StoredDiagnosisResponse,
  AnalyzeImageParams,
  ApiResponse,
} from "../types";

class DiagnosisService {
  /**
   * Analyze medical image without storing
   */
  async analyzeImage(
    params: AnalyzeImageParams
  ): Promise<ApiResponse<DiagnosisResponse>> {
    try {
      const formData = new FormData();

      // Append file
      formData.append("file", {
        uri: params.file.uri,
        name: params.file.name,
        type: params.file.type,
      } as any);

      const headers = await createMultipartHeaders();

      const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.ANALYZE}`, {
        method: "POST",
        headers,
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        return {
          success: false,
          error: error.detail || "Failed to analyze image",
        };
      }

      const data = await response.json();
      return {
        success: true,
        data,
      };
    } catch (error) {
      console.error("Error analyzing image:", error);
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to analyze image",
      };
    }
  }

  /**
   * Analyze and store medical image
   */
  async analyzeAndStoreImage(
    params: AnalyzeImageParams
  ): Promise<ApiResponse<StoredDiagnosisResponse>> {
    try {
      const formData = new FormData();

      // Append file
      formData.append("file", {
        uri: params.file.uri,
        name: params.file.name,
        type: params.file.type,
      } as any);

      // Append patient_id if provided
      if (params.patient_id) {
        formData.append("patient_id", params.patient_id);
      }

      const headers = await createMultipartHeaders();

      const response = await fetch(
        `${API_BASE_URL}${API_ENDPOINTS.ANALYZE_AND_STORE}`,
        {
          method: "POST",
          headers,
          body: formData,
        }
      );

      if (!response.ok) {
        const error = await response.json();
        return {
          success: false,
          error: error.detail || "Failed to analyze and store image",
        };
      }

      const data = await response.json();
      return {
        success: true,
        data,
      };
    } catch (error) {
      console.error("Error analyzing and storing image:", error);
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to analyze and store image",
      };
    }
  }

  /**
   * Get all medical records
   */
  async getRecords(
    patient_id?: string,
    limit: number = 50,
    skip: number = 0
  ): Promise<ApiResponse<StoredDiagnosisResponse[]>> {
    try {
      const params = new URLSearchParams();
      if (patient_id) params.append("patient_id", patient_id);
      params.append("limit", limit.toString());
      params.append("skip", skip.toString());

      const headers = await createHeaders();

      const response = await fetch(
        `${API_BASE_URL}${API_ENDPOINTS.RECORDS}?${params.toString()}`,
        { headers }
      );

      if (!response.ok) {
        const error = await response.json();
        return {
          success: false,
          error: error.detail || "Failed to fetch records",
        };
      }

      const data = await response.json();
      return {
        success: true,
        data,
      };
    } catch (error) {
      console.error("Error fetching records:", error);
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to fetch records",
      };
    }
  }

  /**
   * Get a specific record by ID
   */
  async getRecordById(
    recordId: string
  ): Promise<ApiResponse<StoredDiagnosisResponse>> {
    try {
      const headers = await createHeaders();

      const response = await fetch(
        `${API_BASE_URL}${API_ENDPOINTS.RECORD_BY_ID(recordId)}`,
        { headers }
      );

      if (!response.ok) {
        const error = await response.json();
        return {
          success: false,
          error: error.detail || "Failed to fetch record",
        };
      }

      const data = await response.json();
      return {
        success: true,
        data,
      };
    } catch (error) {
      console.error("Error fetching record:", error);
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to fetch record",
      };
    }
  }

  /**
   * Delete a medical record
   */
  async deleteRecord(
    recordId: string
  ): Promise<ApiResponse<{ message: string }>> {
    try {
      const headers = await createHeaders();

      const response = await fetch(
        `${API_BASE_URL}${API_ENDPOINTS.DELETE_RECORD(recordId)}`,
        {
          method: "DELETE",
          headers,
        }
      );

      if (!response.ok) {
        const error = await response.json();
        return {
          success: false,
          error: error.detail || "Failed to delete record",
        };
      }

      const data = await response.json();
      return {
        success: true,
        data,
      };
    } catch (error) {
      console.error("Error deleting record:", error);
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to delete record",
      };
    }
  }
}

export const diagnosisService = new DiagnosisService();
