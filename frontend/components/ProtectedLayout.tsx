// components/ProtectedLayout.tsx
import { Redirect } from "expo-router";
import { useAuth } from "@/src/context/AuthContext";
import { ActivityIndicator, View } from "react-native";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { state } = useAuth();

  if (state.isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!state.user) {
    return <Redirect href="/(auth)/login" />;
  }

  return <>{children}</>;
}
