import { router } from 'expo-router';
import { Image } from 'expo-image';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { LoadingPaws } from '@/components/ui/LoadingPaws';
import { AnalyticsEvents, trackEvent } from '@/lib/analytics';
import { uploadDogProfileImage } from '@/lib/api/dogApi';
import { useCreateDog } from '@/hooks/useAuthSession';
import { useWelcomeGreeting } from '@/hooks/useDiaries';
import { colors, radius, spacing } from '@/constants/theme';
import { useAuthStore, useOnboardingStore } from '@/stores/walkStore';

function parseWeightKg(value: string): number | null {
  const parsed = Number.parseFloat(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return null;
  return parsed;
}

export default function WelcomeScreen() {
  const store = useOnboardingStore();
  const userId = useAuthStore((s) => s.userId);
  const createDog = useCreateDog();
  const welcomeGreeting = useWelcomeGreeting();
  const [greeting, setGreeting] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(true);

  useEffect(() => {
    (async () => {
      try {
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
          weightKg: parseWeightKg(store.weightKg),
          profileImageUrl,
        });
        trackEvent(AnalyticsEvents.dogRegistered);

        const text = await welcomeGreeting.mutateAsync({
          dogName: store.name,
          personality: store.personality,
          speechStyle: store.speechStyle,
        });
        setGreeting(text);
      } finally {
        setIsCreating(false);
      }
    })();
  }, []);

  if (isCreating || !greeting) {
    return (
      <LoadingPaws message={`${store.name || '우리 아이'}가 인사말을 쓰고 있어요`} />
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.check}>
        <Text style={styles.checkText}>✓</Text>
      </View>
      <Text style={styles.doneTitle}>강아지 등록 완료!</Text>
      <Text style={styles.doneSub}>
        {store.name}의 성격·말투를 반영해 인사말을 쓰고 있어요
      </Text>

      <View style={styles.avatar}>
        {store.profileImageUri ? (
          <Image source={{ uri: store.profileImageUri }} style={styles.avatarImage} contentFit="cover" />
        ) : (
          <Text style={styles.avatarEmoji}>🐶</Text>
        )}
      </View>

      <View style={styles.speech}>
        <Text style={styles.speechText}>&quot;{greeting}&quot;</Text>
      </View>

      <Text style={styles.paws}>🐾 🐾 🐾</Text>

      <Button
        label="산책하러 가볼까?"
        onPress={() => {
          store.reset();
          router.replace('/(tabs)');
        }}
        style={styles.cta}
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
  check: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: colors.moss,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  checkText: { color: colors.white, fontSize: 20, fontWeight: '700' },
  doneTitle: { fontSize: 14, fontWeight: '800', color: colors.ink },
  doneSub: { fontSize: 11, color: colors.grey, marginBottom: spacing.md, textAlign: 'center' },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.apricot,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: spacing.md,
    overflow: 'hidden',
  },
  avatarImage: { width: '100%', height: '100%' },
  avatarEmoji: { fontSize: 28 },
  speech: {
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    padding: spacing.md,
    width: '100%',
    shadowColor: colors.ink,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 18,
    elevation: 3,
  },
  speechText: { fontSize: 14, lineHeight: 22, color: colors.ink },
  paws: { fontSize: 14, marginVertical: spacing.md },
  cta: { width: '100%' },
});
