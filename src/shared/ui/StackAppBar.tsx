import { SymbolView } from 'expo-symbols';
import { StyleSheet, Text, View, type ViewStyle } from 'react-native';

import {
  colors,
  spacing,
  fontSize,
  iconSize,
  sizes,
  zIndex,
  fontWeight,
  lineHeight,
} from '@/shared/config/theme';

import { IconButton } from './IconButton';

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
      <IconButton style={styles.raised} onPress={onBackPress} accessibilityLabel="뒤로">
        <Text style={styles.backIcon}>‹</Text>
      </IconButton>

      <Text style={styles.title} numberOfLines={1}>
        {title}
      </Text>

      {onSharePress ? (
        <IconButton
          style={[styles.raised, styles.rightAction]}
          onPress={onSharePress}
          accessibilityLabel="공유"
        >
          <SymbolView
            name={{ ios: 'square.and.arrow.up', android: 'share', web: 'share' }}
            size={iconSize.sm}
            tintColor={colors.ink}
          />
        </IconButton>
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
  raised: { zIndex: zIndex.base },
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
});
