import { Pressable, StyleSheet, Text, View, type ViewStyle } from 'react-native';

import {
  colors,
  spacing,
  radius,
  fontSize,
  sizes,
  fontWeight,
  borderWidth,
} from '@/constants/theme';

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
      <Pressable style={styles.menuBtn} onPress={onMenuPress}>
        <Text style={styles.menuBtnText}>☰</Text>
      </Pressable>
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
    color: colors.ink,
  },
  menuBtn: {
    width: sizes.control,
    height: sizes.control,
    borderRadius: radius.full,
    backgroundColor: colors.white,
    borderWidth: borderWidth.thin,
    borderColor: colors.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuBtnText: {
    fontSize: fontSize.lg,
    color: colors.ink,
  },
});
