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
import { ShareIcon } from './ShareIcon';

interface StackAppBarProps {
  title: string;
  /** 없으면 뒤로 버튼 자리를 비운다 (돌아갈 곳이 없는 공유 일기 화면) */
  onBackPress?: () => void;
  onSharePress?: () => void;
  style?: ViewStyle;
}

const APP_BAR_HEIGHT = 44;
const sideSize = sizes.iconButton;

export function StackAppBar({ title, onBackPress, onSharePress, style }: StackAppBarProps) {
  return (
    <View style={[styles.bar, style]}>
      {onBackPress ? (
        <IconButton style={styles.raised} onPress={onBackPress} accessibilityLabel="뒤로">
          <Text style={styles.backIcon}>‹</Text>
        </IconButton>
      ) : (
        <View style={styles.sidePlaceholder} />
      )}

      <Text style={styles.title} numberOfLines={1}>
        {title}
      </Text>

      {onSharePress ? (
        <IconButton
          style={[styles.raised, styles.rightAction]}
          onPress={onSharePress}
          accessibilityLabel="공유"
        >
          <ShareIcon size={iconSize.sm} color={colors.fg} />
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
    marginTop: spacing.md,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.bg,
    position: 'relative',
  },
  raised: { zIndex: zIndex.base },
  backIcon: {
    fontSize: fontSize.display,
    lineHeight: lineHeight.lg,
    color: colors.fg,
    marginTop: -spacing.xxs,
  },
  title: {
    position: 'absolute',
    left: spacing.md + sideSize,
    right: spacing.md + sideSize,
    textAlign: 'center',
    fontWeight: fontWeight.bold,
    fontSize: fontSize.base,
    color: colors.fg,
  },
  sidePlaceholder: {
    width: sideSize,
    height: sideSize,
  },
  rightAction: {
    marginLeft: 'auto',
  },
});
