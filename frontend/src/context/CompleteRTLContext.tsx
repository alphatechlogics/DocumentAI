import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useEffect, useState } from "react";
import { I18nManager } from "react-native";

type Language = "en" | "ar";

interface RTLContextType {
  language: Language;
  isRTL: boolean;
  toggleLanguage: () => void;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const RTLContext = createContext<RTLContextType | undefined>(undefined);

// Translation dictionary
const translations: Record<Language, Record<string, string>> = {
  en: {
    // Home Screen
    "app.title": "Document AI",
    "app.subtitle": "Your personal skin care assistant",
    "button.scan": "Scan Skin",
    "button.symptoms": "Symptoms Quiz",
    "button.chatbot": "Chat Bot",
    "history.title": "History",
    "history.viewAll": "View All",
    "history.skinAnalysis": "Skin Analysis",
    "history.noDiagnosis": "No diagnosis available",
    "history.empty": "No history yet",
    "history.medicalRecord": "Medical Record",
    "history.symptomQuestions": "symptom questions answered",
    "history.noDetails": "No details available",
    "history.noRecordsFound": "No medical records found",
    "history.recordsSubtext": "Your scans and symptom quizzes will appear here",

    // Symptoms Quiz
    "symptoms.title": "Symptoms Quiz",
    "symptoms.question": "Question",
    "symptoms.of": "of",
    "symptoms.yes": "Yes",
    "symptoms.no": "No",
    "symptoms.thankYou": "Thank you for your responses!",
    "symptoms.q1": "Do you have a cough?",
    "symptoms.q2": "Do you have a fever?",
    "symptoms.q3": "Is the affected area painful?",
    "symptoms.q4": "Have you noticed any swelling?",
    "symptoms.q5": "Does the affected area itch?",
    "symptoms.assessment": "Symptom assessment completed",
    "symptoms.submitError": "Failed to submit. Please try again.",

    // Common
    "common.loading": "Loading...",
    "common.error": "Error",
    "common.success": "Success",
    "common.cancel": "Cancel",
    "common.confirm": "Confirm",
    "common.back": "Back",
    "common.next": "Next",
    "common.submit": "Submit",
    "common.save": "Save",
    "common.delete": "Delete",
  },
  ar: {
    // Home Screen
    "app.title": "وثيقة الذكاء الاصطناعي",
    "app.subtitle": "مساعدك الشخصي للعناية بالبشرة",
    "button.scan": "مسح الجلد",
    "button.symptoms": "اختبار الأعراض",
    "button.chatbot": "الدردشة الآلية",
    "history.title": "السجل",
    "history.viewAll": "عرض الكل",
    "history.skinAnalysis": "تحليل البشرة",
    "history.noDiagnosis": "لا يوجد تشخيص متاح",
    "history.empty": "لا يوجد سجل بعد",
    "history.medicalRecord": "السجل الطبي",
    "history.symptomQuestions": "أسئلة الأعراض تم الإجابة عليها",
    "history.noDetails": "لا توجد تفاصيل متاحة",

    // Symptoms Quiz
    "symptoms.title": "اختبار الأعراض",
    "symptoms.question": "السؤال",
    "symptoms.of": "من",
    "symptoms.yes": "نعم",
    "symptoms.no": "لا",
    "symptoms.thankYou": "شكراً لك على إجاباتك!",
    "symptoms.q1": "هل لديك سعال؟",
    "symptoms.q2": "هل لديك حمى؟",
    "symptoms.q3": "هل المنطقة المصابة مؤلمة؟",
    "symptoms.q4": "هل لاحظت أي تورم؟",
    "symptoms.q5": "هل المنطقة المصابة تسبب حكة؟",
    "symptoms.assessment": "تم إكمال تقييم الأعراض",
    "symptoms.submitError": "فشل الإرسال. يرجى المحاولة مرة أخرى.",

    // Common
    "common.loading": "جار التحميل...",
    "common.error": "خطأ",
    "common.success": "نجاح",
    "common.cancel": "إلغاء",
    "common.confirm": "تأكيد",
    "common.back": "رجوع",
    "common.next": "التالي",
    "common.submit": "إرسال",
    "common.save": "حفظ",
    "common.delete": "حذف",
  },
};

export const RTLProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [language, setLanguageState] = useState<Language>("en");
  const [isRTL, setIsRTL] = useState(false);

  // Load saved language on mount
  useEffect(() => {
    loadSavedLanguage();
  }, []);

  // Update RTL layout when language changes
  useEffect(() => {
    const shouldBeRTL = language === "ar";
    setIsRTL(shouldBeRTL);
    I18nManager.forceRTL(shouldBeRTL);
  }, [language]);

  const loadSavedLanguage = async () => {
    try {
      const savedLanguage = await AsyncStorage.getItem("app_language");
      if (savedLanguage === "en" || savedLanguage === "ar") {
        setLanguageState(savedLanguage);
      }
    } catch (error) {
      console.error("Failed to load language:", error);
    }
  };

  const setLanguage = async (lang: Language) => {
    try {
      await AsyncStorage.setItem("app_language", lang);
      setLanguageState(lang);
    } catch (error) {
      console.error("Failed to save language:", error);
    }
  };

  const toggleLanguage = () => {
    const newLanguage = language === "en" ? "ar" : "en";
    setLanguage(newLanguage);
  };

  // Translation function
  const t = (key: string): string => {
    return translations[language][key] || key;
  };

  return (
    <RTLContext.Provider
      value={{ language, isRTL, toggleLanguage, setLanguage, t }}
    >
      {children}
    </RTLContext.Provider>
  );
};

export const useRTL = () => {
  const context = useContext(RTLContext);
  if (context === undefined) {
    throw new Error("useRTL must be used within an RTLProvider");
  }
  return context;
};
