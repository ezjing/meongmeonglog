import { Stack } from "expo-router";
import { SafeAreaView, type Edge } from "react-native-safe-area-context";

import { colors } from "@/constants/theme";

interface SafeAreaStackLayoutProps {
  edges?: Edge[];
}

export function SafeAreaStackLayout({
  edges = ["top", "bottom", "left", "right"],
}: SafeAreaStackLayoutProps) {
  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: colors.background }}
      edges={edges}
    >
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
        }}
      />
    </SafeAreaView>
  );
}
