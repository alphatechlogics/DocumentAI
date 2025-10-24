import { Footer } from "@/components/Footer";
import { MenuButton, MenuContent } from "@/components/MenuButton.";
import SplashScreen from "@/components/SplashScreen";
import { DualToneBackground } from "@/components/ui/DualToneBackground";
import { AuthProvider } from "@/src/context/AuthContext";
import { ChatProvider } from "@/src/context/ChatContext";
import { RTLProvider } from "@/src/context/CompleteRTLContext";
import { DiagnosisProvider } from "@/src/context/DiagnosisContext";
import { MenuProvider } from "@/src/context/MenuContext";
import { Stack, useSegments } from "expo-router";
import React, { useState } from "react";
export default function RootLayout() {
  const segments = useSegments();
  const isAuthRoute = segments[0] === "(auth)";
  const isHomeRoute = segments[0] === "home";
  const [appReady, setAppReady] = useState(false);

  if (!appReady) {
    return <SplashScreen onFinish={() => setAppReady(true)} />;
  }

  return (
    <RTLProvider>
      <AuthProvider>
        <ChatProvider>
          <MenuProvider>
            <DiagnosisProvider>
              <DualToneBackground>
                {/* Display MenuContent at the root level so it's always on top */}
                {!isAuthRoute && <MenuContent isHome={isHomeRoute} />}

                {/* MenuButton for home screen - only show on home screen */}
                {!isAuthRoute && isHomeRoute && <MenuButton />}

                <Stack
                  screenOptions={({ route }) => ({
                    headerShown: !isAuthRoute && !isHomeRoute,
                    headerTitleStyle: {
                      fontWeight: "600",
                      fontSize: 18,
                    },
                    headerRight: () => {
                      // Only return the MenuButton if we're not on the home screen and not on auth routes
                      return !isAuthRoute && !isHomeRoute ? (
                        <MenuButton inHeader />
                      ) : null;
                    },
                    // headerStyle: {
                    //   backgroundColor: "transparent",
                    // },
                    // headerTitleAlign: "center",
                    // headerRightContainerStyle: {
                    //   paddingRight: 10,
                    // },
                  })}
                >
                  <Stack.Screen
                    name="(auth)"
                    options={{ headerShown: false }}
                  />
                  <Stack.Screen name="home" options={{ headerShown: false }} />

                  {/* Other screens */}
                  <Stack.Screen
                    name="camera"
                    options={{ title: "Scan Skin" }}
                  />
                  <Stack.Screen
                    name="chatbot"
                    options={{ title: "Chat Bot" }}
                  />
                  <Stack.Screen
                    name="symptoms"
                    options={{ title: "Symptoms Quiz" }}
                  />
                  <Stack.Screen name="details" options={{ title: "Details" }} />
                  <Stack.Screen name="history" options={{ title: "History" }} />
                  <Stack.Screen
                    name="+not-found"
                    options={{ title: "Not Found" }}
                  />
                </Stack>
                <Footer />
              </DualToneBackground>
            </DiagnosisProvider>
          </MenuProvider>
        </ChatProvider>
      </AuthProvider>
    </RTLProvider>
  );
}
