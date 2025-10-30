import { AuthProvider, useAuth } from "@/lib/auth-context";
import { Slot } from "expo-router";
import React, { useEffect, useState } from "react";
import { PaperProvider } from "react-native-paper";
import { useRouter, useSegments } from "expo-router";

function RouteGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { state } = useAuth();
  const segments = useSegments();
  const [isNavigationReady, setIsNavigationReady] = useState(false);

  // Mark navigation as ready after first render
  useEffect(() => {
    setIsNavigationReady(true);
  }, []);

  useEffect(() => {
    // Wait for navigation to be ready
    if (!isNavigationReady) return;

    // Don't do anything while loading
    if (state.isLoading) return;

    // Check if we're in the auth route
    const inAuthGroup = segments[0] === "auth";

    console.log("RouteGuard:", {
      user: state.user,
      segments,
      inAuthGroup,
      isNavigationReady,
    });

    // Use setTimeout to defer navigation to next tick
    const timeoutId = setTimeout(() => {
      if (!state.user && !inAuthGroup) {
        // User is not signed in and not on auth screen, redirect to auth
        router.replace("/auth");
      } else if (state.user && inAuthGroup) {
        // User is signed in but still on auth screen, redirect to home
        router.replace("/(tabs)");
      }
    }, 0);

    return () => clearTimeout(timeoutId);
  }, [state.user, state.isLoading, segments, isNavigationReady]);

  return <>{children}</>;
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <PaperProvider>
        <RouteGuard>
          <Slot />
        </RouteGuard>
      </PaperProvider>
    </AuthProvider>
  );
}
