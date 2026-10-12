import '@/lib/walk/backgroundWalkTask';

import { QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { OverlayProvider } from '@/components/ui/overlay';
import { colors } from '@/constants/theme';
import { initKakaoSdk } from '@/lib/kakaoAuth';
import { initNaverSdk } from '@/lib/naverAuth';
import { queryClient } from '@/lib/queryClient';
import { useAuthStore } from '@/stores/walkStore';

export default function RootLayout() {
  const isLoggedIn = useAuthStore((s) => s.userId != null);

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
              {/* 로그인 상태가 바뀌면 반대쪽 화면들이 스택에서 제거되어 뒤로가기로 돌아갈 수 없다 */}
              <Stack.Protected guard={!isLoggedIn}>
                <Stack.Screen name="(auth)" />
              </Stack.Protected>
              <Stack.Protected guard={isLoggedIn}>
                <Stack.Screen name="(onboarding)" />
                <Stack.Screen name="(tabs)" />
                <Stack.Screen name="walk" />
                <Stack.Screen name="diary" />
                <Stack.Screen name="share" />
              </Stack.Protected>
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
