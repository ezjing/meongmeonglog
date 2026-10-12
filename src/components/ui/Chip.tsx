import { Pressable, StyleSheet, Text } from 'react-native';

import { colors, spacing, radius, fontSize, fontWeight, borderWidth } from '@/constants/theme';

interface ChipProps {
  label: string;
  selected?: boolean;
  onPress?: () => void;
}

export function Chip({ label, selected = false, onPress }: ChipProps) {
  return (
    <Pressable onPress={onPress} style={[styles.chip, selected && styles.selected]}>
      <Text style={[styles.label, selected && styles.selectedLabel]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    borderRadius: radius.full,
    borderWidth: borderWidth.medium,
    borderColor: colors.line,
    backgroundColor: colors.white,
    paddingHorizontal: spacing.ms,
    paddingVertical: spacing.sm,
  },
  selected: {
    backgroundColor: colors.ink,
    borderColor: colors.ink,
  },
  label: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.inkSoft,
  },
  selectedLabel: {
    color: colors.white,
  },
});
