import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { isLoginCancelled, readWebOAuthCallback, useAuthSession } from '@/features/auth';
import { resolveOnboardingRoute } from '@/features/onboarding';
import { colors, fontSize } from '@/shared/config/theme';
import { AppError } from '@/shared/lib/AppError';
import { useOverlay } from '@/shared/ui/overlay/index';

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export function AuthCallbackScreen() {
  const params = useLocalSearchParams<{ code?: string; state?: string; error?: string }>();
  const { loginWithCode } = useAuthSession();
  const { showToast } = useOverlay();
  const startedRef = useRef(false);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;

    const finish = async () => {
      try {
        const callback = readWebOAuthCallback({
          code: firstParam(params.code),
          state: firstParam(params.state),
          error: firstParam(params.error),
        });
        const session = await loginWithCode(callback);
        const route = await resolveOnboardingRoute(session.userId);
        router.replace(route);
      } catch (error) {
        const message =
          error instanceof AppError || error instanceof Error
            ? error.message
            : '로그인에 실패했습니다.';
        showToast({
          message,
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
