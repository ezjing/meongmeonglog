import { SymbolView, type SymbolViewProps } from 'expo-symbols';
import {
  Pressable,
  StyleSheet,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { colors, radius, iconSize, sizes, borderWidth, opacity } from '@/constants/theme';

type IconButtonIcon = 'back' | 'share';

interface IconButtonProps extends Omit<PressableProps, 'style'> {
  icon: IconButtonIcon;
  style?: StyleProp<ViewStyle>;
}

const iconNames: Record<IconButtonIcon, SymbolViewProps['name']> = {
  back: { ios: 'chevron.left', android: 'arrow_back', web: 'arrow_back' },
  share: { ios: 'square.and.arrow.up', android: 'share', web: 'share' },
};

export function IconButton({ icon, style, ...props }: IconButtonProps) {
  const name = iconNames[icon];

  return (
    <Pressable style={({ pressed }) => [styles.base, pressed && styles.pressed, style]} {...props}>
      <SymbolView name={name} size={iconSize.md} tintColor={colors.ink} />
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
