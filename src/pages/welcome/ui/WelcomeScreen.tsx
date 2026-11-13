import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useCreateDog, uploadDogProfileImage } from '@/entities/dog';
import { useWelcomeGreeting, useOnboardingStore } from '@/features/onboarding';
import {
  colors,
  spacing,
  radius,
  fontSize,
  emojiSize,
  fontWeight,
  lineHeight,
  shadows,
} from '@/shared/config/theme';
import { AnalyticsEvents, trackEvent } from '@/shared/lib/analytics';
import { useBackConfirmAction } from '@/shared/lib/useBackConfirmAction';
import { useAuthStore } from '@/shared/session/sessionStore';
import { Button } from '@/shared/ui/Button';
import { LoadingPaws } from '@/shared/ui/LoadingPaws';

const CHECK_SIZE = 46;
const AVATAR_SIZE = 64;

function parseWeightKg(value: string): number | null {
  const parsed = Number.parseFloat(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return null;
  return parsed;
}

export function WelcomeScreen() {
  const store = useOnboardingStore();
  const userId = useAuthStore((s) => s.userId);
  const createDog = useCreateDog();
  const welcomeGreeting = useWelcomeGreeting();
  const [greeting, setGreeting] = useState<string | null>(null);
  const [status, setStatus] = useState<'creating' | 'failed' | 'done'>('creating');
  // 재시도할 때 이미 등록된 강아지를 다시 등록하지 않기 위함
  const dogCreatedRef = useRef(false);
  const allowLeaveRef = useRef<(() => void) | null>(null);

  // 등록이 끝나면 홈으로. 이전 단계로 돌아가 다시 진입하면 강아지가 중복 등록되므로 뒤로가기도 홈으로 보낸다
  const goHome = useCallback(() => {
    if (status !== 'done') return;
    store.reset();
    allowLeaveRef.current?.();
    router.dismissTo('/(tabs)');
  }, [status, store]);

  const { allowLeave } = useBackConfirmAction(goHome);

  useEffect(() => {
    allowLeaveRef.current = allowLeave;
  }, [allowLeave]);

  // 온보딩 store → 강아지 등록 → 환영 인사 생성
  const registerDog = async () => {
    try {
      if (!dogCreatedRef.current) {
        let profileImageUrl: string | undefined;
        if (store.profileImageUri && userId) {
          profileImageUrl = await uploadDogProfileImage(userId, store.profileImageUri);
        }

        await createDog.mutateAsync({
          name: store.name,
          breed: store.breed,
          birthDate: store.birthDate,
          gender: store.gender,
          personality: store.personality,
          speechStyle: store.speechStyle,
          customPersonality: store.customPersonality.trim(),
          customSpeechStyle: store.customSpeechStyle.trim(),
          weightKg: parseWeightKg(store.weightKg),
          profileImageUrl,
        });
        dogCreatedRef.current = true;
        trackEvent(AnalyticsEvents.dogRegistered);
      }
    } catch {
      setStatus('failed');
      return;
    }

    // 강아지는 이미 등록됐으므로 인사말 생성이 실패해도 기본 인사말로 완료 처리한다
    let text: string;
    try {
      text = await welcomeGreeting.mutateAsync({
        dogName: store.name,
        personality: store.personality,
        speechStyle: store.speechStyle,
        customSpeechStyle: store.customSpeechStyle.trim(),
      });
    } catch {
      text = `안녕! 나는 ${store.name}야. 앞으로 같이 산책 많이 하자!`;
    }
    setGreeting(text);
    setStatus('done');
  };

  const handleRetry = () => {
    setStatus('creating');
    registerDog();
  };

  useEffect(() => {
    (async () => {
      await registerDog();
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- 마운트 시 1회 실행
  }, []);

  if (status === 'failed') {
    return (
      <View style={styles.container}>
        <Text style={styles.doneTitle}>등록 중 문제가 생겼어요</Text>
        <Text style={styles.doneSub}>잠시 후 다시 시도해주세요</Text>
        <Button label="다시 시도" onPress={handleRetry} style={styles.cta} />
      </View>
    );
  }

  if (status === 'creating' || !greeting) {
    return <LoadingPaws message={`${store.name}가 인사말을 쓰고 있어요`} />;
  }

  return (
    <View style={styles.container}>
      <View style={styles.check}>
        <Text style={styles.checkText}>✓</Text>
      </View>
      <Text style={styles.doneTitle}>강아지 등록 완료!</Text>
      <Text style={styles.doneSub}>{store.name}의 성격·말투를 반영해 인사말을 쓰고 있어요</Text>

      <View style={styles.avatar}>
        {store.profileImageUri ? (
          <Image
            source={{ uri: store.profileImageUri }}
            style={styles.avatarImage}
            contentFit="cover"
          />
        ) : (
          <Text style={styles.avatarEmoji}>🐶</Text>
        )}
      </View>

      <View style={styles.speech}>
        <Text style={styles.speechText}>&quot;{greeting}&quot;</Text>
      </View>

      <Text style={styles.paws}>🐾 🐾 🐾</Text>

      <Button label="산책하러 가볼까?" onPress={goHome} style={styles.cta} />
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
  check: {
    width: CHECK_SIZE,
    height: CHECK_SIZE,
    borderRadius: radius.full,
    backgroundColor: colors.moss,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  checkText: { color: colors.white, fontSize: fontSize.xxl, fontWeight: fontWeight.bold },
  doneTitle: { fontSize: fontSize.base, fontWeight: fontWeight.extrabold, color: colors.ink },
  doneSub: {
    fontSize: fontSize.sm,
    color: colors.grey,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  avatar: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: radius.full,
    backgroundColor: colors.apricot,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: spacing.md,
    overflow: 'hidden',
  },
  avatarImage: { width: '100%', height: '100%' },
  avatarEmoji: { fontSize: emojiSize.sm },
  speech: {
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    padding: spacing.md,
    width: '100%',
    ...shadows.raised,
  },
  speechText: { fontSize: fontSize.base, lineHeight: lineHeight.lg, color: colors.ink },
  paws: { fontSize: fontSize.base, marginVertical: spacing.md },
  cta: { width: '100%' },
});
