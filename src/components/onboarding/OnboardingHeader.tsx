import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { PawProgress } from '@/components/ui/PawProgress';
import { colors, spacing, fontSize, fontWeight, hitSlop } from '@/constants/theme';

interface OnboardingHeaderProps {
  currentStep: number;
  totalSteps?: number;
  onBack?: () => void;
}

export function OnboardingHeader({ currentStep, totalSteps, onBack }: OnboardingHeaderProps) {
  const handleBack = () => {
    if (onBack) {
      onBack();
      return;
    }
    router.back();
  };

  return (
    <View style={styles.header}>
      <Pressable
        onPress={handleBack}
        style={styles.backBtn}
        hitSlop={hitSlop}
        accessibilityRole="button"
      >
        <Text style={styles.backText}>←</Text>
      </Pressable>
      <View style={styles.progressWrap}>
        <PawProgress currentStep={currentStep} totalSteps={totalSteps} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    marginBottom: spacing.sm,
  },
  backBtn: {
    alignSelf: 'flex-start',
    paddingVertical: spacing.xs,
    marginBottom: spacing.xs,
  },
  backText: {
    fontSize: fontSize.display,
    color: colors.ink,
    fontWeight: fontWeight.semibold,
  },
  progressWrap: {
    paddingHorizontal: spacing.xs,
  },
});
