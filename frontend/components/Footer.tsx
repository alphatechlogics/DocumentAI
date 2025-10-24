import { useRouter, useSegments } from "expo-router";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

export const Footer = () => {
  const router = useRouter();
  const segments = useSegments();

  const handlePress = () => {
    // Don't navigate if we're in the auth group
    if (segments[0] === "(auth)") {
      return;
    }
    router.push("/home");
  };

  return (
    <View style={styles.footer}>
      <TouchableOpacity onPress={handlePress}>
        <Text style={styles.footerText}>DocumentAI</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  footer: {
    backgroundColor: "#000000",
    padding: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  footerText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },
});
