import { SymbolView } from 'expo-symbols';
import { Pressable, StyleSheet, Text, View, type ViewStyle } from 'react-native';

import {
  colors,
  spacing,
  fontSize,
  iconSize,
  sizes,
  zIndex,
  fontWeight,
  lineHeight,
  borderWidth,
  opacity,
} from '@/constants/theme';

interface StackAppBarProps {
  title: string;
  onBackPress: () => void;
  onSharePress?: () => void;
  style?: ViewStyle;
}

const APP_BAR_HEIGHT = 44;
const sideSize = sizes.control;

export function StackAppBar({ title, onBackPress, onSharePress, style }: StackAppBarProps) {
  return (
    <View style={[styles.bar, style]}>
      <Pressable
        style={({ pressed }) => [styles.circleBtn, pressed && styles.pressed]}
        onPress={onBackPress}
        accessibilityRole="button"
        accessibilityLabel="뒤로"
      >
        <Text style={styles.backIcon}>‹</Text>
      </Pressable>

      <Text style={styles.title} numberOfLines={1}>
        {title}
      </Text>

      {onSharePress ? (
        <Pressable
          style={({ pressed }) => [styles.circleBtn, styles.rightAction, pressed && styles.pressed]}
          onPress={onSharePress}
          accessibilityRole="button"
          accessibilityLabel="공유"
        >
          <SymbolView
            name={{ ios: 'square.and.arrow.up', android: 'share', web: 'share' }}
            size={iconSize.sm}
            tintColor={colors.ink}
          />
        </Pressable>
      ) : (
        <View style={[styles.sidePlaceholder, styles.rightAction]} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    height: APP_BAR_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    backgroundColor: colors.background,
    position: 'relative',
  },
  circleBtn: {
    width: sideSize,
    height: sideSize,
    borderRadius: sideSize / 2,
    backgroundColor: colors.white,
    borderWidth: borderWidth.thin,
    borderColor: colors.line,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: zIndex.base,
  },
  backIcon: {
    fontSize: fontSize.display,
    lineHeight: lineHeight.lg,
    fontWeight: fontWeight.bold,
    color: colors.ink,
    marginTop: -spacing.xxs,
  },
  title: {
    position: 'absolute',
    left: spacing.md + sideSize,
    right: spacing.md + sideSize,
    textAlign: 'center',
    fontWeight: fontWeight.bold,
    fontSize: fontSize.base,
    color: colors.ink,
  },
  sidePlaceholder: {
    width: sideSize,
    height: sideSize,
  },
  rightAction: {
    marginLeft: 'auto',
  },
  pressed: {
    opacity: opacity.pressed,
  },
});
