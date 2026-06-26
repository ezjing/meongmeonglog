import { StyleSheet, Text, View } from 'react-native';

import { colors, spacing } from '@/constants/theme';

interface PawProgressProps {
  currentStep: number;
  totalSteps?: number;
}

export function PawProgress({ currentStep, totalSteps = 3 }: PawProgressProps) {
  return (
    <View style={styles.row}>
      {Array.from({ length: totalSteps }, (_, i) => {
        const step = i + 1;
        const active = step <= currentStep;
        return (
          <View key={step} style={styles.item}>
            {i > 0 && <View style={[styles.line, active && styles.lineActive]} />}
            <Text style={[styles.paw, active && styles.pawActive]}>🐾</Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md - 2,
    gap: spacing.sm - 2,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  line: {
    flex: 1,
    height: 2,
    backgroundColor: colors.line,
    marginRight: spacing.sm - 2,
  },
  lineActive: {
    backgroundColor: colors.apricot,
  },
  paw: {
    fontSize: 12,
    opacity: 0.25,
  },
  pawActive: {
    opacity: 1,
  },
});
