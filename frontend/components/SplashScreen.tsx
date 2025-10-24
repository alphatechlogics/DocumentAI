import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { Animated, Image, StyleSheet, View } from "react-native";

// Prevent native splash screen from auto-hiding
SplashScreen.preventAutoHideAsync();

export default function AppSplashScreen({
  onFinish,
}: {
  onFinish: () => void;
}) {
  const fadeAnim = new Animated.Value(0);

  useEffect(() => {
    const animate = async () => {
      // 1. First make logo appear
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }).start();

      // 2. Wait 2 seconds
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // 3. Hide splash and notify parent
      await SplashScreen.hideAsync();
      onFinish();
    };

    animate();
  }, []);

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.logoContainer, { opacity: fadeAnim }]}>
        <Image
          source={require("../assets/images/logo.png")}
          style={styles.logo}
          resizeMode="contain"
          onLoad={() => SplashScreen.hideAsync()} // Fallback
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0000ffff",
    justifyContent: "center",
    alignItems: "center",
  },
  logoContainer: {
    alignItems: "center",
  },
  logo: {
    width: 200,
    height: 200,
  },
});
