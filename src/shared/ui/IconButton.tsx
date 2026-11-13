import type React from 'react';
import {
  Pressable,
  StyleSheet,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { colors, radius, sizes, borderWidth, opacity } from '@/shared/config/theme';

interface IconButtonProps extends Omit<PressableProps, 'style' | 'children'> {
  children: React.ReactNode;
  /** 눌렀을 때 살짝 흐려지는 효과 */
  pressedFeedback?: boolean;
  style?: StyleProp<ViewStyle>;
}

/** 앱바 등에 쓰는 흰색 원형 아이콘 버튼 */
export function IconButton({ children, pressedFeedback = true, style, ...props }: IconButtonProps) {
  return (
    <Pressable
      style={({ pressed }) => [styles.base, pressedFeedback && pressed && styles.pressed, style]}
      accessibilityRole="button"
      {...props}
    >
      {children}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    width: sizes.control,
    height: sizes.control,
    borderRadius: radius.full,
    backgroundColor: colors.white,
    borderWidth: borderWidth.thin,
    borderColor: colors.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: opacity.pressed,
  },
});
