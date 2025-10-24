import { Button } from "@/components/ui/Button";
import { DualToneBackground } from "@/components/ui/DualToneBackground";
import { useRTL } from "@/src/context/CompleteRTLContext";
import { saveMedicalRecord } from "@/src/services/api";
import { useNavigation, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

type QuestionnaireProps = {
  onComplete?: (answers: boolean[]) => Promise<void>;
  onCancel?: () => void;
};

export default function Questionnaire({
  onComplete,
  onCancel,
}: QuestionnaireProps) {
  const router = useRouter();
  const navigation = useNavigation();
  const { isRTL, t } = useRTL();

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<boolean[]>([]);
  const [allQuestionsAnswered, setAllQuestionsAnswered] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    navigation.setOptions({
      title: t("symptoms.title"),
      headerShown: true,
    });
  }, [navigation, t]);

  const questions = [
    t("symptoms.q1"),
    t("symptoms.q2"),
    t("symptoms.q3"),
    t("symptoms.q4"),
    t("symptoms.q5"),
  ];

  // Default handler for when accessed directly (not from camera)
  const defaultOnComplete = async (answers: boolean[]) => {
    const questionsData = questions.map((question, index) => ({
      question,
      answer: answers[index] ? t("symptoms.yes") : t("symptoms.no"),
    }));

    await saveMedicalRecord({
      questions: questionsData,
      diagnosis: t("symptoms.assessment"),
      dangerLevel: 0,
    });
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      // Use provided onComplete or default handler
      const submitHandler = onComplete || defaultOnComplete;
      await submitHandler(answers);
      router.replace("/home");
    } catch (error) {
      console.error("Submission error:", error);
      setSubmitError(
        error instanceof Error ? error.message : t("symptoms.submitError")
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    }
  };

  const handleAnswer = (answer: boolean) => {
    const newAnswers = [...answers, answer];
    setAnswers(newAnswers);

    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      setAllQuestionsAnswered(true);
    }
  };

  const isYesSelected = answers[currentQuestionIndex] === true;
  const isNoSelected = answers[currentQuestionIndex] === false;

  const dynamicStyles = getDynamicStyles(isRTL);

  if (allQuestionsAnswered) {
    return (
      <DualToneBackground>
        <View style={styles.content}>
          <Text style={[styles.question, dynamicStyles.text]}>
            {t("symptoms.thankYou")}
          </Text>

          <View style={styles.submitContainer}>
            {isSubmitting ? (
              <ActivityIndicator size="large" color="#7928CA" />
            ) : (
              <Button
                title={t("common.submit")}
                onPress={handleSubmit}
                variant="primary"
                style={styles.submitButton}
                disabled={isSubmitting}
              />
            )}
            {submitError && (
              <Text style={[styles.errorText, dynamicStyles.text]}>
                {submitError}
              </Text>
            )}
          </View>
        </View>
      </DualToneBackground>
    );
  }

  return (
    <DualToneBackground>
      <View style={styles.content}>
        <Text style={[styles.counter, dynamicStyles.text]}>
          {t("symptoms.question")} {currentQuestionIndex + 1} {t("symptoms.of")}{" "}
          {questions.length}
        </Text>

        <Text style={[styles.question, dynamicStyles.text]}>
          {questions[currentQuestionIndex]}
        </Text>

        <View style={styles.buttons}>
          <Button
            title={t("symptoms.yes")}
            onPress={() => handleAnswer(true)}
            variant={isYesSelected ? "primary" : "secondary"}
            style={[
              styles.button,
              isYesSelected && { backgroundColor: "#7928CA" },
              !isYesSelected && { backgroundColor: "#E5E7EB" },
            ]}
            textStyle={[
              isYesSelected && { color: "#FFFFFF" },
              !isYesSelected && { color: "#000000" },
            ]}
          />
          <Button
            title={t("symptoms.no")}
            onPress={() => handleAnswer(false)}
            variant={isNoSelected ? "primary" : "secondary"}
            style={[
              styles.button,
              isNoSelected && { backgroundColor: "#7928CA" },
              !isNoSelected && { backgroundColor: "#E5E7EB" },
            ]}
            textStyle={[
              isNoSelected && { color: "#FFFFFF" },
              !isNoSelected && { color: "#000000" },
            ]}
          />
        </View>
      </View>
    </DualToneBackground>
  );
}

const getDynamicStyles = (isRTL: boolean) =>
  StyleSheet.create({
    text: {
      textAlign: isRTL ? "right" : "left",
      writingDirection: isRTL ? "rtl" : "ltr",
    },
  });

const styles = StyleSheet.create({
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  counter: {
    color: "white",
    fontSize: 18,
    marginBottom: 30,
  },
  question: {
    color: "white",
    fontSize: 24,
    textAlign: "center",
    marginBottom: 100,
    paddingHorizontal: 20,
  },
  buttons: {
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    gap: 8,
    marginBottom: 30,
  },
  button: {
    width: "40%",
    height: 35,
  },
  submitContainer: {
    width: "100%",
    alignItems: "center",
    marginTop: 20,
  },
  submitButton: {
    width: "60%",
    alignSelf: "center",
  },
  errorText: {
    color: "red",
    marginTop: 10,
    textAlign: "center",
  },
});
