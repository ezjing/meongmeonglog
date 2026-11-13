import { StyleSheet, Text, View, type ViewStyle } from 'react-native';

import { colors, spacing, fontSize, fontWeight } from '@/shared/config/theme';

import { IconButton } from './IconButton';

const APP_BAR_MIN_HEIGHT = 42;

interface TabAppBarProps {
  title?: string;
  onMenuPress: () => void;
  children?: React.ReactNode;
  style?: ViewStyle;
}

export function TabAppBar({ title, onMenuPress, children, style }: TabAppBarProps) {
  return (
    <View style={[styles.header, style]}>
      <View style={styles.headerMain}>
        {children ?? (title ? <Text style={styles.title}>{title}</Text> : null)}
      </View>
      <IconButton pressedFeedback={false} onPress={onMenuPress} accessibilityLabel="메뉴">
        <Text style={styles.menuBtnText}>☰</Text>
      </IconButton>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.ms,
    marginBottom: spacing.md,
    minHeight: APP_BAR_MIN_HEIGHT,
  },
  headerMain: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.extrabold,
    color: colors.fg,
  },
  menuBtnText: {
    fontSize: fontSize.lg,
    color: colors.fg,
  },
});
