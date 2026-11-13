import type React from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import {
  colors,
  spacing,
  radius,
  fontSize,
  iconSize,
  fontWeight,
  borderWidth,
  opacity,
} from '@/shared/config/theme';

type ButtonVariant = 'primary' | 'outline' | 'soft' | 'kakao' | 'naver';

interface ButtonProps extends PressableProps {
  label: string;
  variant?: ButtonVariant;
  style?: StyleProp<ViewStyle>;
  icon?: React.ReactNode;
}

const variantStyles: Record<ButtonVariant, { container: ViewStyle; text: { color: string } }> = {
  primary: {
    container: { backgroundColor: colors.primary },
    text: { color: colors.fgOnPrimary },
  },
  outline: {
    container: {
      backgroundColor: 'transparent',
      borderWidth: borderWidth.medium,
      borderColor: colors.borderStrong,
    },
    text: { color: colors.fg },
  },
  soft: {
    container: {
      backgroundColor: colors.surface,
      borderWidth: borderWidth.thin,
      borderColor: colors.border,
    },
    text: { color: colors.fg },
  },
  kakao: {
    container: { backgroundColor: colors.kakao, borderRadius: radius.control },
    text: { color: colors.kakaoFg },
  },
  naver: {
    container: { backgroundColor: colors.naver, borderRadius: radius.control },
    text: { color: colors.naverFg },
  },
};

export function Button({
  label,
  variant = 'primary',
  disabled,
  style,
  icon,
  ...props
}: ButtonProps) {
  const v = variantStyles[variant];
  return (
    <Pressable
      style={({ pressed }) => [
        styles.base,
        v.container,
        disabled && styles.disabled,
        pressed && styles.pressed,
        style,
      ]}
      disabled={disabled}
      {...props}
    >
      <View style={styles.content}>
        {icon ? <View style={styles.iconWrap}>{icon}</View> : null}
        <Text style={[styles.label, v.text]}>{label}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.controlLg,
    paddingVertical: spacing.ms,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  iconWrap: {
    width: iconSize.lg,
    height: iconSize.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
  },
  disabled: {
    opacity: opacity.disabled,
  },
  pressed: {
    opacity: opacity.pressed,
  },
});
