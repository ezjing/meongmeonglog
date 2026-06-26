import { Pressable, StyleSheet, Text } from 'react-native';

import { colors, radius, spacing } from '@/constants/theme';

interface ChipProps {
  label: string;
  selected?: boolean;
  onPress?: () => void;
}

export function Chip({ label, selected = false, onPress }: ChipProps) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.chip, selected && styles.selected]}
    >
      <Text style={[styles.label, selected && styles.selectedLabel]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    borderRadius: radius.full,
    borderWidth: 1.3,
    borderColor: colors.line,
    backgroundColor: colors.white,
    paddingHorizontal: spacing.sm + 3,
    paddingVertical: spacing.sm - 2,
  },
  selected: {
    backgroundColor: colors.ink,
    borderColor: colors.ink,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: '#5b5b66',
  },
  selectedLabel: {
    color: colors.white,
  },
});
