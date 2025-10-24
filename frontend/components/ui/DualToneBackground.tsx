import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { StyleSheet, View } from "react-native";

interface DualToneBackgroundProps {
  children?: React.ReactNode;
  style?: object;
}

export function DualToneBackground({
  children,
  style,
}: DualToneBackgroundProps) {
  return (
    <View style={[styles.container, style]}>
      {/* Left side - 30% width (Dark gray/black) */}
      <LinearGradient
        colors={["#61a3c7ff", "#c7d7d9ff"]} // Very dark gray to dark gray
        style={styles.leftSide}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
      />

      {/* Right side - 70% width (Slightly lighter dark gray) */}
      <LinearGradient
        colors={["#c7d7d9ff", "#ffffffff"]} // Dark gray to medium dark gray
        style={styles.rightSide}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
      />

      {/* Content */}
      {children && <View style={styles.content}>{children}</View>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: "100%",
    position: "relative",
    backgroundColor: "#0a0a0a", // fallback color
  },
  leftSide: {
    position: "absolute",
    top: 0,
    left: 0,
    bottom: 0,
    width: "30%",
  },
  rightSide: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    width: "70%",
  },
  content: {
    flex: 1,
    zIndex: 10,
  },
});
