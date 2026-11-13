import { useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, TextInput } from 'react-native';

import { dogBreedOptions, filterDogBreeds, type DogBreedOption } from '@/entities/dog';
import { colors, spacing, radius, fontSize, fontWeight, borderWidth } from '@/shared/config/theme';
import { BottomSheet } from '@/shared/ui/overlay/index';

const LIST_MAX_HEIGHT = 280;

interface BreedPickerProps {
  value: string;
  onSelect: (breed: string) => void;
}

export function BreedPicker({ value, onSelect }: BreedPickerProps) {
  const [visible, setVisible] = useState(false);
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => filterDogBreeds(dogBreedOptions, query), [query]);

  const selectedLabel = value || '품종을 선택해주세요';

  const handleSelect = (option: DogBreedOption) => {
    onSelect(option.label);
    setVisible(false);
    setQuery('');
  };

  const closeSheet = () => {
    setVisible(false);
    setQuery('');
  };

  return (
    <>
      <Pressable style={styles.trigger} onPress={() => setVisible(true)}>
        <Text style={[styles.triggerText, !value && styles.placeholder]}>{selectedLabel}</Text>
        <Text style={styles.chevron}>⌄</Text>
      </Pressable>

      <BottomSheet
        visible={visible}
        onClose={closeSheet}
        title="품종 선택"
        subtitle="품종을 검색하거나 선택해주세요"
      >
        <TextInput
          style={styles.search}
          value={query}
          onChangeText={setQuery}
          placeholder="품종 검색"
          placeholderTextColor={colors.fgSubtle}
          autoCorrect={false}
        />

        <FlatList
          data={filtered}
          keyExtractor={(item) => item.key}
          keyboardShouldPersistTaps="handled"
          style={styles.list}
          renderItem={({ item }) => (
            <Pressable
              style={[styles.option, value === item.label && styles.optionActive]}
              onPress={() => handleSelect(item)}
            >
              <Text style={[styles.optionText, value === item.label && styles.optionTextActive]}>
                {item.label}
              </Text>
            </Pressable>
          )}
        />
      </BottomSheet>
    </>
  );
}

const styles = StyleSheet.create({
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderWidth: borderWidth.medium,
    borderColor: colors.border,
    borderRadius: radius.control,
    padding: spacing.ms,
    marginBottom: spacing.ms,
  },
  triggerText: { fontSize: fontSize.base, color: colors.fg, flex: 1 },
  placeholder: { color: colors.fgMuted },
  chevron: { fontSize: fontSize.lg, color: colors.fgMuted, marginLeft: spacing.sm },
  search: {
    backgroundColor: colors.surfaceMuted,
    borderWidth: borderWidth.medium,
    borderColor: colors.border,
    borderRadius: radius.control,
    padding: spacing.ms,
    fontSize: fontSize.base,
    color: colors.fg,
    marginBottom: spacing.sm,
  },
  list: {
    maxHeight: LIST_MAX_HEIGHT,
    marginBottom: spacing.sm,
  },
  option: {
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.md,
    borderBottomWidth: borderWidth.hairline,
    borderBottomColor: colors.border,
  },
  optionActive: { backgroundColor: colors.primarySubtle },
  optionText: { fontSize: fontSize.base, color: colors.fg },
  optionTextActive: { fontWeight: fontWeight.bold },
});
