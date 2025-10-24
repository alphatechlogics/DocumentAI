// components/TabsWithFooter.tsx
import React from "react";
import { View } from "react-native";
import { Footer } from "./Footer";

export const TabsWithFooter = ({ children }: { children: React.ReactNode }) => {
  return (
    <View style={{ flex: 1 }}>
      <View style={{ flex: 1 }}>{children}</View>
      <Footer />
    </View>
  );
};
