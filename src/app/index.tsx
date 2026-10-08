import { Redirect, type Href } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors } from '@/constants/theme';
import { loadAuthSession } from '@/lib/authStorage';
import { resolveOnboardingRoute } from '@/lib/onboardingRoute';
import { loadPersistedWalkState } from '@/lib/walk/walkSessionStorage';
import { useAuthStore, useWalkStore } from '@/stores/walkStore';

export default function Index() {
  const userId = useAuthStore((s) => s.userId);
  const setSession = useAuthStore((s) => s.setSession);
  const [ready, setReady] = useState(false);
  const [route, setRoute] = useState<Href | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const stored = await loadAuthSession();
        if (!stored) return;

        setSession(stored.userId, stored.provider);

        const persistedWalk = await loadPersistedWalkState();
        if (persistedWalk?.activeWalk && !persistedWalk.activeWalk.endedAt) {
          useWalkStore.getState().hydrateFromPersisted(persistedWalk);
          setRoute(persistedWalk.frozenElapsedSec != null ? '/walk/finish' : '/walk/active');
        } else {
          const nextRoute = await resolveOnboardingRoute(stored.userId);
          setRoute(nextRoute);
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
        <ActivityIndicator color={colors.apricot} />
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
    backgroundColor: colors.background,
  },
});
