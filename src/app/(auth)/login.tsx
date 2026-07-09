import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { BottomSheet, useOverlay } from '@/components/ui/overlay';
import { KakaoIcon, NaverIcon } from '@/components/ui/SocialIcons';
import { colors, spacing } from '@/constants/theme';
import { useAuthSession } from '@/hooks/useAuthSession';
import { AnalyticsEvents, trackEvent } from '@/lib/analytics';
import { AppError } from '@/lib/AppError';
import { getKakaoAccessToken } from '@/lib/kakaoAuth';
import { getNaverAccessToken } from '@/lib/naverAuth';
import { resolveOnboardingRoute } from '@/lib/onboardingRoute';
import type { AuthProvider } from '@/types/database';

export default function LoginScreen() {
  const { login, isLoggingIn } = useAuthSession();
  const { showToast } = useOverlay();
  const [accountSheetVisible, setAccountSheetVisible] = useState(false);

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
    const providerLabel = provider === 'kakao' ? '카카오' : '네이버';

    try {
      const accessToken =
        provider === 'kakao'
          ? await getKakaoAccessToken({ forceAccountPicker })
          : await getNaverAccessToken({ forceAccountPicker });

      const session = await login({ provider, accessToken });
      trackEvent(AnalyticsEvents.loginComplete, { provider });
      await navigateAfterLogin(session.userId);
    } catch (error) {
      showToast({
        message: `⚠️ ${getLoginErrorMessage(error, providerLabel)}`,
        variant: 'warning',
      });
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
          icon={<KakaoIcon size={20} />}
          onPress={() => handleProviderLogin('kakao')}
          disabled={isLoggingIn}
        />
        <Button
          label="네이버로 시작하기"
          variant="naver"
          icon={<NaverIcon size={20} />}
          onPress={() => handleProviderLogin('naver')}
          disabled={isLoggingIn}
        />
      </View>

      <Pressable
        onPress={() => setAccountSheetVisible(true)}
        disabled={isLoggingIn}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel="다른 계정으로 로그인"
      >
        <Text style={[styles.otherAccount, isLoggingIn && styles.otherAccountDisabled]}>
          다른 계정으로 로그인
        </Text>
      </Pressable>

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
            icon: <KakaoIcon size={16} />,
            iconBg: colors.kakao,
            label: '카카오 다른 계정',
            onPress: () => handleProviderLogin('kakao', true),
          },
          {
            icon: <NaverIcon size={16} />,
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
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  logo: {
    width: 74,
    height: 74,
    borderRadius: 22,
    backgroundColor: colors.apricot,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
    overflow: 'hidden',
  },
  logoEmoji: {
    fontSize: 34,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.ink,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: 12,
    color: colors.grey,
    marginBottom: spacing.xl,
  },
  buttons: {
    width: '100%',
    gap: spacing.sm,
  },
  otherAccount: {
    marginTop: spacing.md,
    fontSize: 12,
    fontWeight: '700',
    color: colors.grey,
    textDecorationLine: 'underline',
  },
  otherAccountDisabled: {
    opacity: 0.5,
  },
  footer: {
    marginTop: spacing.lg,
    fontSize: 10,
    color: colors.grey,
    textAlign: 'center',
    lineHeight: 16,
  },
});
