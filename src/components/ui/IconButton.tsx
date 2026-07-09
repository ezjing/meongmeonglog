import { SymbolView, type SymbolViewProps } from 'expo-symbols';
import {
  Pressable,
  StyleSheet,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { colors } from '@/constants/theme';

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
      <SymbolView name={name} size={18} tintColor={colors.ink} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.85,
  },
});
