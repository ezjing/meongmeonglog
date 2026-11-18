import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';

import {
  KakaoIcon,
  NaverIcon,
  PROVIDER_LABEL,
  useAuthSession,
  getKakaoAccessToken,
  startAppOAuth,
  startWebOAuth,
} from '@/features/auth';
import { resolveOnboardingRoute } from '@/features/onboarding';
import type { AuthProvider } from '@/shared/api/database';
import {
  colors,
  spacing,
  radius,
  fontSize,
  emojiSize,
  iconSize,
  fontWeight,
  lineHeight,
  hitSlop,
} from '@/shared/config/theme';
import { AnalyticsEvents, trackEvent } from '@/shared/lib/analytics';
import { AppError } from '@/shared/lib/AppError';
import { useAuthStore } from '@/shared/session/sessionStore';
import { Button } from '@/shared/ui/Button';
import { BottomSheet, useOverlay } from '@/shared/ui/overlay/index';

const LOGO_SIZE = 74;

export function LoginScreen() {
  const { login, loginWithAppCode, isLoggingIn } = useAuthSession();
  const { showToast } = useOverlay();
  const [accountSheetVisible, setAccountSheetVisible] = useState(false);
  const [isStartingWebLogin, setIsStartingWebLogin] = useState(false);
  const sessionEndedElsewhere = useAuthStore((s) => s.sessionEndedElsewhere);
  const setSessionEndedElsewhere = useAuthStore((s) => s.setSessionEndedElsewhere);

  useEffect(() => {
    if (!sessionEndedElsewhere) return;
    showToast({ message: '다른 기기에서 로그인되어 로그아웃되었어요', variant: 'warning' });
    setSessionEndedElsewhere(false);
  }, [sessionEndedElsewhere, setSessionEndedElsewhere, showToast]);

  const navigateAfterLogin = async (userId: string) => {
    const route = await resolveOnboardingRoute(userId);
    router.replace(route);
  };

  const getLoginErrorMessage = (error: unknown, providerLabel: string) => {
    if (error instanceof AppError) return error.message;
    if (error instanceof Error) return error.message;
    return `${providerLabel} 로그인에 실패했습니다.`;
  };

  const handleProviderLogin = async (provider: AuthProvider, forceAccountPicker = false) => {
    const providerLabel = PROVIDER_LABEL[provider];

    if (Platform.OS === 'web') {
      setIsStartingWebLogin(true);
      try {
        await startWebOAuth(provider, forceAccountPicker);
      } catch (error) {
        setIsStartingWebLogin(false);
        showToast({
          message: getLoginErrorMessage(error, providerLabel),
          variant: 'error',
        });
      }
      return;
    }

    try {
      let session;
      if (provider === 'kakao') {
        const accessToken = await getKakaoAccessToken({ forceAccountPicker });
        session = await login({ provider, accessToken });
      } else {
        // 네이버는 브라우저로 로그인하고 서버가 인가 코드를 교환한다 (앱에 secret을 두지 않음)
        setIsStartingWebLogin(true);
        try {
          session = await loginWithAppCode(await startAppOAuth(provider, forceAccountPicker));
        } finally {
          setIsStartingWebLogin(false);
        }
      }
      trackEvent(AnalyticsEvents.loginComplete, { provider });
      await navigateAfterLogin(session.userId);
    } catch (error) {
      const message = getLoginErrorMessage(error, providerLabel);
      // 직접 취소한 경우는 실패가 아니므로 웹 콜백 화면과 같이 안내(주황)로 보여준다
      showToast({ message, variant: message === '로그인이 취소되었습니다.' ? 'warning' : 'error' });
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.logo}>
        <Text style={styles.logoEmoji}>🐾</Text>
      </View>
      <Text style={styles.title}>멍멍로그</Text>
      <Text style={styles.subtitle}>산책이 일기가 되는 시간</Text>

      <View style={styles.buttons}>
        <Button
          label="카카오로 시작하기"
          variant="kakao"
          icon={<KakaoIcon size={iconSize.lg} />}
          onPress={() => handleProviderLogin('kakao')}
          disabled={isLoggingIn || isStartingWebLogin}
        />
        <Button
          label="네이버로 시작하기"
          variant="naver"
          icon={<NaverIcon size={iconSize.lg} />}
          onPress={() => handleProviderLogin('naver')}
          disabled={isLoggingIn || isStartingWebLogin}
        />
      </View>

      <Button
        label="다른 계정으로 로그인"
        variant="text"
        onPress={() => setAccountSheetVisible(true)}
        disabled={isLoggingIn || isStartingWebLogin}
        hitSlop={hitSlop}
        style={styles.otherAccount}
      />

      <Text style={styles.footer}>
        계속 진행하면 이용약관 및 개인정보 처리방침에{'\n'}동의하는 것으로 간주됩니다
      </Text>

      <BottomSheet
        visible={accountSheetVisible}
        onClose={() => setAccountSheetVisible(false)}
        title="다른 계정으로 로그인"
        subtitle="계정 선택 화면으로 이동합니다"
        options={[
          {
            icon: <KakaoIcon size={iconSize.sm} />,
            iconBg: colors.kakao,
            label: '카카오 다른 계정',
            onPress: () => handleProviderLogin('kakao', true),
          },
          {
            icon: <NaverIcon size={iconSize.sm} />,
            iconBg: colors.naver,
            label: '네이버 다른 계정',
            onPress: () => handleProviderLogin('naver', true),
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  logo: {
    width: LOGO_SIZE,
    height: LOGO_SIZE,
    borderRadius: radius.cardLg,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
    overflow: 'hidden',
  },
  logoEmoji: {
    fontSize: emojiSize.md,
  },
  title: {
    fontSize: fontSize.display,
    fontWeight: fontWeight.extrabold,
    color: colors.fg,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: fontSize.md,
    color: colors.fgMuted,
    marginBottom: spacing.xl,
  },
  buttons: {
    width: '100%',
    gap: spacing.sm,
  },
  otherAccount: { marginTop: spacing.md },
  footer: {
    marginTop: spacing.lg,
    fontSize: fontSize.xs,
    color: colors.fgMuted,
    textAlign: 'center',
    lineHeight: lineHeight.sm,
  },
});
