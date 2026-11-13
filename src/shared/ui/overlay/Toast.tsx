import { useEffect } from 'react';
import { StyleSheet, Text } from 'react-native';
import Animated, { FadeInDown, FadeOutDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  colors,
  spacing,
  radius,
  fontSize,
  zIndex,
  fontWeight,
  shadows,
} from '@/shared/config/theme';

import type { ToastOptions, ToastVariant } from './types';

interface ToastViewProps extends ToastOptions {
  onHide: () => void;
}

const variantBackground: Record<ToastVariant, string> = {
  success: colors.success,
  warning: colors.warning,
  error: colors.danger,
};

export function ToastView({ message, variant, duration = 2800, onHide }: ToastViewProps) {
  const insets = useSafeAreaInsets();

  useEffect(() => {
    const timer = setTimeout(onHide, duration);
    return () => clearTimeout(timer);
  }, [duration, onHide]);

  return (
    <Animated.View
      entering={FadeInDown.duration(220)}
      exiting={FadeOutDown.duration(180)}
      style={[
        styles.wrap,
        { bottom: insets.bottom + spacing.ml },
        { backgroundColor: variantBackground[variant] },
      ]}
      pointerEvents="none"
    >
      <Text style={styles.message}>{message}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: spacing.md,
    right: spacing.md,
    zIndex: zIndex.toast,
    borderRadius: radius.card,
    paddingVertical: spacing.ms,
    paddingHorizontal: spacing.md,
    ...shadows.modal,
  },
  message: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.fgOnPrimary,
    textAlign: 'center',
  },
});
