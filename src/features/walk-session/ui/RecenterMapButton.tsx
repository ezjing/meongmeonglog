import { Pressable, StyleSheet, Text } from 'react-native';

import { colors, fontSize, radius, shadows, sizes, spacing } from '@/shared/config/theme';

export function RecenterMapButton({ onPress }: { onPress: () => void }) {
  return (
    <Pressable
      style={styles.recenterBtn}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel="내 위치로 이동"
    >
      <Text style={styles.recenterText}>📍</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  recenterBtn: {
    position: 'absolute',
    right: spacing.ms,
    bottom: spacing.ms,
    backgroundColor: colors.surface,
    borderRadius: radius.full,
    width: sizes.iconButton,
    height: sizes.iconButton,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.control,
  },
  recenterText: { fontSize: fontSize.lg },
});
