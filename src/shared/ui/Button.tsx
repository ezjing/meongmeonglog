import type React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import {
  buttonTokens,
  spacing,
  radius,
  fontSize,
  iconSize,
  fontWeight,
  borderWidth,
  opacity,
  type ButtonVariant,
} from '@/shared/config/theme';

type ButtonSize = 'lg' | 'md';

interface ButtonProps extends PressableProps {
  label: string;
  /**
   * 역할 (docs/design-tokens.md "버튼 역할")
   * - primary: 화면당 1개인 주요 행동
   * - secondary: 주요 행동 옆의 보조 행동
   * - danger: 되돌릴 수 없는 행동 (확인 다이얼로그를 거친다) · dangerFilled: 그 확인 다이얼로그의 확인 버튼
   * - text: 눈에 덜 띄어야 하는 이탈·부가 행동
   * - kakao / naver / instagram: 외부 서비스
   */
  variant?: ButtonVariant;
  /** lg: 화면 버튼 (기본) · md: 다이얼로그 버튼 */
  size?: ButtonSize;
  /** 처리 중: 스피너를 보여주고 누르지 못하게 한다 */
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
  icon?: React.ReactNode;
}

export function Button({
  label,
  variant = 'primary',
  size = 'lg',
  loading = false,
  disabled,
  style,
  icon,
  ...props
}: ButtonProps) {
  const tokens: { bg: string; fg: string; border?: string } = buttonTokens[variant];
  const isText = variant === 'text';
  const isDisabled = disabled || loading;

  return (
    <Pressable
      style={({ pressed }) => [
        isText ? styles.textBase : styles.base,
        size === 'md' && !isText && styles.baseMd,
        { backgroundColor: tokens.bg },
        tokens.border && { borderWidth: borderWidth.thin, borderColor: tokens.border },
        variant === 'kakao' || variant === 'naver' ? styles.socialRadius : null,
        isDisabled && styles.disabled,
        pressed && styles.pressed,
        style,
      ]}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      {...props}
    >
      <View style={styles.content}>
        {loading ? (
          <ActivityIndicator size="small" color={tokens.fg} />
        ) : icon ? (
          <View style={styles.iconWrap}>{icon}</View>
        ) : null}
        <Text
          style={[
            isText ? styles.textLabel : styles.label,
            size === 'md' && !isText && styles.labelMd,
            { color: tokens.fg },
          ]}
        >
          {label}
        </Text>
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
  baseMd: {
    paddingHorizontal: spacing.sm,
  },
  socialRadius: {
    borderRadius: radius.control,
  },
  textBase: {
    alignSelf: 'center',
    paddingVertical: spacing.sm,
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
  labelMd: {
    fontSize: fontSize.md,
  },
  textLabel: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    textDecorationLine: 'underline',
  },
  disabled: {
    opacity: opacity.disabled,
  },
  pressed: {
    opacity: opacity.pressed,
  },
});
