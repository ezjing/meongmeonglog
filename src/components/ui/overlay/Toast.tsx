import { useEffect } from 'react';
import { StyleSheet, Text } from 'react-native';
import Animated, { FadeInDown, FadeOutDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, radius } from '@/constants/theme';

import type { ToastOptions, ToastVariant } from './types';

interface ToastViewProps extends ToastOptions {
  onHide: () => void;
}

const variantStyles: Record<
  ToastVariant,
  { container: object; text: object; chip?: boolean }
> = {
  default: {
    container: { backgroundColor: colors.ink },
    text: { color: colors.white },
  },
  success: {
    container: { backgroundColor: colors.moss },
    text: { color: colors.white },
  },
  warning: {
    container: { backgroundColor: colors.danger, borderRadius: radius.full },
    text: { color: colors.white },
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
        { bottom: insets.bottom + 20 },
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
    left: 14,
    right: 14,
    zIndex: 100,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 13,
    elevation: 8,
  },
  barWrap: {
    borderRadius: radius.md,
    paddingVertical: 13,
    paddingHorizontal: 14,
  },
  chipWrap: {
    alignSelf: 'center',
    left: undefined,
    right: undefined,
    borderRadius: radius.full,
    paddingVertical: 9,
    paddingHorizontal: 16,
    maxWidth: '92%',
  },
  message: {
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
  },
});
