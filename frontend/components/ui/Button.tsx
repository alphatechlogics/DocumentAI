import React from "react";
import {
  TouchableOpacity,
  Text,
  StyleProp,
  ViewStyle,
  TextStyle,
} from "react-native";
import { GlobalStyles } from "@/styles/global";

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: "primary" | "secondary";
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  disabled?: boolean;
}

export const Button = ({
  title,
  onPress,
  variant = "primary",
  style,
  textStyle,
  disabled = false,
}: ButtonProps) => {
  return (
    <TouchableOpacity
      style={[
        GlobalStyles.button,
        variant === "primary"
          ? GlobalStyles.primaryButton
          : GlobalStyles.secondaryButton,
        style,
        disabled && GlobalStyles.disabledButton,
      ]}
      onPress={onPress}
      disabled={disabled}
    >
      <Text
        style={[
          GlobalStyles.buttonText,
          variant === "primary"
            ? GlobalStyles.primaryButtonText
            : GlobalStyles.secondaryButtonText,
          textStyle,
          disabled && GlobalStyles.disabledButtonText,
        ]}
      >
        {title}
      </Text>
    </TouchableOpacity>
  );
};
