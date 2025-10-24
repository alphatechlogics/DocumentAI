import { API_URL, SECURITY_SERVICE_URL } from "@env";

export interface Question {
  question: string;
  answer: string;
}

export interface DiagnosisResult {
  status: string;
  diagnosis: string;
  danger_level: number;
  image_url: string;
}

export const analyzeSkinImage = async (
  imageUri: string,
  patientId: string,
  questions: Question[]
): Promise<DiagnosisResult> => {
  const formData = new FormData();

  // Prepare image file
  const filename = imageUri.split("/").pop();
  const file = {
    uri: imageUri,
    name: filename,
    type: `image/${filename?.split(".").pop()}`,
  } as any;

  formData.append("file", file);
  formData.append("patient_id", patientId);
  formData.append("questions", JSON.stringify(questions));

  const response = await fetch(`${API_URL}analyze_and_store`, {
    method: "POST",
    body: formData,
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || "Image analysis failed");
  }

  return response.json();
};
