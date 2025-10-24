import React, { createContext, useContext, useState, useCallback } from "react";
import { analyzeSkinImage } from "../services/diagnosisDataSaveApi";
import { useRouter } from "expo-router";

interface Question {
  question: string;
  answer: string;
}

interface DiagnosisData {
  imageUri: string | null;
  diagnosis: string | null;
  dangerLevel: number;
  questions: Question[];
  patientId: string;
}

interface DiagnosisContextType {
  diagnosisData: DiagnosisData;
  captureImage: (uri: string) => void;
  submitDiagnosis: () => Promise<void>;
  submitQuestionnaire: (answers: Question[]) => Promise<void>;
  resetDiagnosis: () => void;
  isLoading: boolean;
  error: string | null;
}

const defaultState: DiagnosisData = {
  imageUri: null,
  diagnosis: null,
  dangerLevel: 0,
  questions: [],
  patientId: "user-123", // Replace with actual user ID
};

const DiagnosisContext = createContext<DiagnosisContextType | undefined>(
  undefined
);

export const DiagnosisProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [diagnosisData, setDiagnosisData] =
    useState<DiagnosisData>(defaultState);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const captureImage = useCallback((uri: string) => {
    setDiagnosisData((prev) => ({
      ...prev,
      imageUri: uri,
    }));
  }, []);

  const submitDiagnosis = useCallback(async () => {
    if (!diagnosisData.imageUri) return;

    setIsLoading(true);
    setError(null);

    try {
      const result = await analyzeSkinImage(
        diagnosisData.imageUri,
        diagnosisData.patientId,
        diagnosisData.questions
      );

      setDiagnosisData((prev) => ({
        ...prev,
        diagnosis: result.diagnosis,
        dangerLevel: result.danger_level,
      }));

      router.push("/home");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Analysis failed");
    } finally {
      setIsLoading(false);
    }
  }, [
    diagnosisData.imageUri,
    diagnosisData.patientId,
    diagnosisData.questions,
  ]);

  const submitQuestionnaire = useCallback(async (answers: Question[]) => {
    setDiagnosisData((prev) => ({
      ...prev,
      questions: answers,
    }));

    // Navigate back to results after submitting questionnaire
    router.push("/home");
  }, []);

  const resetDiagnosis = useCallback(() => {
    setDiagnosisData(defaultState);
    setError(null);
  }, []);

  return (
    <DiagnosisContext.Provider
      value={{
        diagnosisData,
        captureImage,
        submitDiagnosis,
        submitQuestionnaire,
        resetDiagnosis,
        isLoading,
        error,
      }}
    >
      {children}
    </DiagnosisContext.Provider>
  );
};

export const useDiagnosis = () => {
  const context = useContext(DiagnosisContext);
  if (!context) {
    throw new Error("useDiagnosis must be used within a DiagnosisProvider");
  }
  return context;
};
