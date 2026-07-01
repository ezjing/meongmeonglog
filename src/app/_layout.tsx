import { QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { StyleSheet } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { OverlayProvider } from "@/components/ui/overlay";
import { colors } from "@/constants/theme";
import { initKakaoSdk } from "@/lib/kakaoAuth";
import { initNaverSdk } from "@/lib/naverAuth";
import { queryClient } from "@/lib/queryClient";

export default function RootLayout() {
  useEffect(() => {
    initKakaoSdk();
    initNaverSdk();
  }, []);

  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <OverlayProvider>
          <QueryClientProvider client={queryClient}>
            <StatusBar style="dark" />
            <Stack
              screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: colors.background },
              }}
            >
              <Stack.Screen name="index" />
              <Stack.Screen name="(auth)" />
              <Stack.Screen name="(onboarding)" />
              <Stack.Screen name="(tabs)" />
              <Stack.Screen name="walk" />
              <Stack.Screen name="diary" />
              <Stack.Screen name="share" />
              <Stack.Screen name="guardian" />
            </Stack>
          </QueryClientProvider>
        </OverlayProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
