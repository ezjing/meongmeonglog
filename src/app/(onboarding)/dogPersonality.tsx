import { router } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { OnboardingHeader } from '@/components/onboarding/OnboardingHeader';
import { Button } from '@/components/ui/Button';
import { Chip } from '@/components/ui/Chip';
import { personalityOptions, speechStyleOptions } from '@/constants/personalityOptions';
import { colors, radius, spacing } from '@/constants/theme';
import { useOnboardingStore } from '@/stores/walkStore';

export default function DogPersonalityScreen() {
  const { name, personality, speechStyle, setPersonality } = useOnboardingStore();

  const togglePersonality = (item: string) => {
    const next = personality.includes(item)
      ? personality.filter((p) => p !== item)
      : [...personality, item];
    setPersonality({ personality: next });
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <OnboardingHeader currentStep={2} />

      <Text style={styles.title}>{name || '우리 아이'}는 어떤 성격인가요?</Text>
      <Text style={styles.subtitle}>중복 선택 가능 · AI 일기 말투에 반영돼요</Text>

      <View style={styles.chipRow}>
        {personalityOptions.map((item) => (
          <Chip
            key={item}
            label={item}
            selected={personality.includes(item)}
            onPress={() => togglePersonality(item)}
          />
        ))}
      </View>

      <Text style={styles.subtitle}>말투 (선택사항)</Text>
      <View style={styles.chipRow}>
        {speechStyleOptions.map((item) => (
          <Chip
            key={item}
            label={item}
            selected={speechStyle === item}
            onPress={() => setPersonality({ speechStyle: item })}
          />
        ))}
      </View>

      <View style={styles.bubble}>
        <Text style={styles.bubbleText}>
          🐾 &quot;{personality.slice(0, 2).join('하고 ') || '우리 아이'} 말투로 일기를 써줄게!&quot;
        </Text>
      </View>

      <Button
        label="다음"
        disabled={personality.length === 0}
        onPress={() => router.push('/(onboarding)/welcome')}
        style={styles.nextBtn}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md, paddingBottom: spacing.xl },
  title: { fontSize: 18, fontWeight: '800', color: colors.ink, marginTop: spacing.sm },
  subtitle: { fontSize: 12, color: colors.grey, marginBottom: spacing.md },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm - 2, marginBottom: spacing.md },
  bubble: {
    backgroundColor: colors.white,
    borderWidth: 1.3,
    borderColor: colors.line,
    borderRadius: radius.md - 2,
    padding: spacing.md - 4,
    marginBottom: spacing.lg,
  },
  bubbleText: { fontSize: 12, color: '#5b5b66' },
  nextBtn: { marginTop: spacing.sm },
});
