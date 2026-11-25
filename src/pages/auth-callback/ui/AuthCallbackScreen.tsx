import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import {
  isLoginCancelled,
  loginErrorMessage,
  readWebOAuthCallback,
  useAuthSession,
} from '@/features/auth';
import { resolveOnboardingRoute } from '@/features/onboarding';
import type { AuthProvider } from '@/shared/api/database';
import { colors, fontSize } from '@/shared/config/theme';
import { firstParam } from '@/shared/lib/firstParam';
import { useOverlay } from '@/shared/ui/overlay';

export function AuthCallbackScreen() {
  const params = useLocalSearchParams<{ code?: string; state?: string; error?: string }>();
  const { loginWithCode } = useAuthSession();
  const { showToast } = useOverlay();
  const startedRef = useRef(false);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;

    const finish = async () => {
      let provider: AuthProvider | null = null;
      try {
        const callback = readWebOAuthCallback({
          code: firstParam(params.code),
          state: firstParam(params.state),
          error: firstParam(params.error),
        });
        provider = callback.provider;
        const session = await loginWithCode(callback);
        const route = await resolveOnboardingRoute(session.userId);
        router.replace(route);
      } catch (error) {
        showToast({
          message: loginErrorMessage(error, provider),
          variant: isLoginCancelled(error) ? 'warning' : 'error',
        });
        router.replace('/login');
      }
    };

    void finish();
  }, [loginWithCode, params.code, params.error, params.state, showToast]);

  return (
    <View style={styles.center}>
      <Text style={styles.loading}>불러오는 중...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg },
  loading: { color: colors.fgMuted, fontSize: fontSize.md },
});
