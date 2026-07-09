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

import { colors, radius, spacing } from '@/constants/theme';

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
      borderWidth: 1.5,
      borderColor: colors.ink,
    },
    text: { color: colors.ink },
  },
  soft: {
    container: {
      backgroundColor: colors.white,
      borderWidth: 1,
      borderColor: colors.line,
    },
    text: { color: colors.ink },
  },
  kakao: {
    container: { backgroundColor: colors.kakao, borderRadius: radius.social },
    text: { color: colors.kakaoText },
  },
  naver: {
    container: { backgroundColor: colors.naver, borderRadius: radius.social },
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
    borderRadius: radius.md,
    paddingVertical: spacing.md - 3,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconWrap: {
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 15,
    fontWeight: '700',
  },
  disabled: {
    opacity: 0.5,
  },
  pressed: {
    opacity: 0.85,
  },
});
