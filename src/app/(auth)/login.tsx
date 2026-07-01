import { router } from "expo-router";
import { StyleSheet, Text, View } from "react-native";

import { Button } from "@/components/ui/Button";
import { useOverlay } from "@/components/ui/overlay";
import { colors, spacing } from "@/constants/theme";
import { useAuthSession } from "@/hooks/useAuthSession";
import { AnalyticsEvents, trackEvent } from "@/lib/analytics";
import { resolveOnboardingRoute } from "@/lib/onboardingRoute";
import { AppError } from "@/lib/AppError";
import { getKakaoAccessToken } from "@/lib/kakaoAuth";
import { getNaverAccessToken } from "@/lib/naverAuth";

export default function LoginScreen() {
  const { login, isLoggingIn } = useAuthSession();
  const { showToast } = useOverlay();

  const navigateAfterLogin = async (userId: string) => {
    const route = await resolveOnboardingRoute(userId);
    router.replace(route);
  };

  const handleKakaoLogin = async () => {
    try {
      const accessToken = await getKakaoAccessToken();
      const session = await login({ provider: "kakao", accessToken });
      trackEvent(AnalyticsEvents.loginComplete, { provider: "kakao" });
      await navigateAfterLogin(session.userId);
    } catch (error) {
      const message =
        error instanceof AppError
          ? error.message
          : error instanceof Error
            ? error.message
            : "카카오 로그인에 실패했습니다.";
      showToast({ message: `⚠️ ${message}`, variant: "warning" });
    }
  };

  const handleNaverLogin = async () => {
    try {
      const accessToken = await getNaverAccessToken();
      const session = await login({ provider: "naver", accessToken });
      trackEvent(AnalyticsEvents.loginComplete, { provider: "naver" });
      await navigateAfterLogin(session.userId);
    } catch (error) {
      const message =
        error instanceof AppError
          ? error.message
          : error instanceof Error
            ? error.message
            : "네이버 로그인에 실패했습니다.";
      showToast({ message: `⚠️ ${message}`, variant: "warning" });
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
          label="💬  카카오로 시작하기"
          variant="kakao"
          onPress={handleKakaoLogin}
          disabled={isLoggingIn}
        />
        <Button
          label="N  네이버로 시작하기"
          variant="naver"
          onPress={handleNaverLogin}
          disabled={isLoggingIn}
          style={styles.naverBtn}
        />
      </View>

      <Text style={styles.footer}>
        계속 진행하면 이용약관 및 개인정보 처리방침에{"\n"}동의하는 것으로
        간주됩니다
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.lg,
  },
  logo: {
    width: 74,
    height: 74,
    borderRadius: 22,
    backgroundColor: colors.apricot,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.md,
    overflow: "hidden",
  },
  logoEmoji: {
    fontSize: 34,
  },
  title: {
    fontSize: 22,
    fontWeight: "800",
    color: colors.ink,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: 12,
    color: colors.grey,
    marginBottom: spacing.xl,
  },
  buttons: {
    width: "100%",
    gap: spacing.sm,
  },
  naverBtn: {
    marginTop: spacing.sm,
  },
  footer: {
    marginTop: spacing.lg,
    fontSize: 10,
    color: colors.grey,
    textAlign: "center",
    lineHeight: 16,
  },
});
