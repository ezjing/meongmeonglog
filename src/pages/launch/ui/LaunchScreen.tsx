import { Redirect, type Href } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { loadPersistedWalkState, useWalkStore } from '@/entities/walk';
import { checkSupabaseSession, handleSessionLost, loadAuthSession } from '@/features/auth';
import { resolveOnboardingRoute } from '@/features/onboarding';
import { colors } from '@/shared/config/theme';
import { useAuthStore } from '@/shared/session/sessionStore';

export function LaunchScreen() {
  const userId = useAuthStore((s) => s.userId);
  const setSession = useAuthStore((s) => s.setSession);
  const [ready, setReady] = useState(false);
  const [route, setRoute] = useState<Href | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const stored = await loadAuthSession();
        if (!stored) return;

        // 세션 확인·진행 중 산책·다음 화면 조회를 동시에 시작한다 (첫 화면까지 기다림을 줄임)
        const routePromise = resolveOnboardingRoute(stored.userId).catch(() => null);
        const [sessionStatus, persistedWalk] = await Promise.all([
          checkSupabaseSession(stored.userId),
          loadPersistedWalkState(),
        ]);

        // 앱 로그인 정보만 남고 Supabase 세션이 끊긴 경우 → 로그인 화면으로
        if (sessionStatus === 'missing') {
          await handleSessionLost();
          return;
        }

        setSession(stored.userId, stored.provider);

        if (persistedWalk?.activeWalk && !persistedWalk.activeWalk.endedAt) {
          useWalkStore.getState().hydrateFromPersisted(persistedWalk);
          setRoute(persistedWalk.frozenElapsedSec != null ? '/walk/finish' : '/walk/active');
        } else {
          // 조회에 실패하면 기본 경로(홈 탭)로 진입
          const nextRoute = await routePromise;
          if (nextRoute) setRoute(nextRoute);
        }
      } catch {
        // 오프라인 등으로 경로 확인에 실패하면 기본 경로(홈 탭)로 진입
      } finally {
        setReady(true);
      }
    })();
  }, [setSession]);

  if (!ready) {
    return (
      <SafeAreaView style={styles.loading}>
        <ActivityIndicator color={colors.primary} />
      </SafeAreaView>
    );
  }

  if (!userId) {
    return <Redirect href="/(auth)/login" />;
  }

  return <Redirect href={route ?? '/(tabs)'} />;
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bg,
  },
});
