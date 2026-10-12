import { Fragment } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { colors, fontSize, opacity } from '@/constants/theme';

const LINE_HEIGHT = 2;

interface PawProgressProps {
  currentStep: number;
  totalSteps?: number;
}

export function PawProgress({ currentStep, totalSteps = 3 }: PawProgressProps) {
  const steps = Array.from({ length: totalSteps }, (_, i) => i + 1);

  return (
    <View style={styles.row}>
      {steps.map((step, index) => (
        <Fragment key={step}>
          <Text style={[styles.paw, step <= currentStep && styles.pawActive]}>🐾</Text>
          {index < totalSteps - 1 ? (
            <View style={[styles.line, currentStep > index + 1 && styles.lineActive]} />
          ) : null}
        </Fragment>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  line: {
    flex: 1,
    height: LINE_HEIGHT,
    backgroundColor: colors.line,
  },
  lineActive: {
    backgroundColor: colors.apricot,
  },
  paw: {
    fontSize: fontSize.md,
    opacity: opacity.subtle,
  },
  pawActive: {
    opacity: 1,
  },
});
