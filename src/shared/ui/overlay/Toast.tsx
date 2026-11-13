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

const variantStyles: Record<ToastVariant, { container: object; text: object; chip?: boolean }> = {
  default: {
    container: { backgroundColor: colors.surfaceInverse },
    text: { color: colors.fgInverse },
  },
  success: {
    container: { backgroundColor: colors.success },
    text: { color: colors.fgOnPrimary },
  },
  warning: {
    container: { backgroundColor: colors.danger, borderRadius: radius.full },
    text: { color: colors.fgOnPrimary },
    chip: true,
  },
};

export function ToastView({
  message,
  variant = 'default',
  duration = 2800,
  onHide,
}: ToastViewProps) {
  const insets = useSafeAreaInsets();
  const style = variantStyles[variant];

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
        style.chip ? styles.chipWrap : styles.barWrap,
        style.container,
      ]}
      pointerEvents="none"
    >
      <Text style={[styles.message, style.text]}>{message}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: spacing.md,
    right: spacing.md,
    zIndex: zIndex.toast,
    ...shadows.modal,
  },
  barWrap: {
    borderRadius: radius.card,
    paddingVertical: spacing.ms,
    paddingHorizontal: spacing.md,
  },
  chipWrap: {
    alignSelf: 'center',
    left: undefined,
    right: undefined,
    borderRadius: radius.full,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    maxWidth: '92%',
  },
  message: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    textAlign: 'center',
  },
});
