import { Pressable, StyleSheet, Text, View, type ViewStyle } from 'react-native';

import { colors, spacing } from '@/constants/theme';

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
    gap: spacing.sm + 2,
    marginBottom: spacing.md,
    minHeight: 42,
  },
  headerMain: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.ink,
  },
  menuBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuBtnText: {
    fontSize: 16,
    color: colors.ink,
  },
});
