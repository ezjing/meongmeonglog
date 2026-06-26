import { Stack } from 'expo-router';
import { QueryClientProvider } from '@tanstack/react-query';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StyleSheet } from 'react-native';

import { queryClient } from '@/lib/queryClient';
import { initKakaoSdk } from '@/lib/kakaoAuth';
import { initNaverSdk } from '@/lib/naverAuth';
import { colors } from '@/constants/theme';

export default function RootLayout() {
  useEffect(() => {
    initKakaoSdk();
    initNaverSdk();
  }, []);

  return (
    <GestureHandlerRootView style={styles.root}>
      <QueryClientProvider client={queryClient}>
        <StatusBar style="dark" />
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="(auth)/login" />
          <Stack.Screen name="(onboarding)/dogBasic" />
          <Stack.Screen name="(onboarding)/dogPersonality" />
          <Stack.Screen name="(onboarding)/welcome" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="walk/active" />
          <Stack.Screen name="walk/finish" />
          <Stack.Screen name="diary/generate" />
          <Stack.Screen name="diary/[id]" />
          <Stack.Screen name="share/[diaryId]" />
        </Stack>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
