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
} from '@/constants/theme';

type ButtonVariant = 'primary' | 'outline' | 'soft' | 'kakao' | 'naver';

interface ButtonProps extends PressableProps {
  label: string;
  variant?: ButtonVariant;
  style?: StyleProp<ViewStyle>;
  icon?: React.ReactNode;
}

const variantStyles: Record<ButtonVariant, { container: ViewStyle; text: { color: string } }> = {
  primary: {
    container: { backgroundColor: colors.apricot },
    text: { color: colors.white },
  },
  outline: {
    container: {
      backgroundColor: 'transparent',
      borderWidth: borderWidth.medium,
      borderColor: colors.ink,
    },
    text: { color: colors.ink },
  },
  soft: {
    container: {
      backgroundColor: colors.white,
      borderWidth: borderWidth.thin,
      borderColor: colors.line,
    },
    text: { color: colors.ink },
  },
  kakao: {
    container: { backgroundColor: colors.kakao, borderRadius: radius.md },
    text: { color: colors.kakaoText },
  },
  naver: {
    container: { backgroundColor: colors.naver, borderRadius: radius.md },
    text: { color: colors.white },
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
    borderRadius: radius.lg,
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
