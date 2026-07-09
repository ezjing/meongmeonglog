import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { BottomSheet } from '@/components/ui/overlay';
import { filterDogBreeds, type DogBreedOption } from '@/constants/dogBreedLabels';
import { colors, radius, spacing } from '@/constants/theme';
import { useDogBreeds } from '@/hooks/useDogBreeds';

interface BreedPickerProps {
  value: string;
  onSelect: (breed: string) => void;
}

export function BreedPicker({ value, onSelect }: BreedPickerProps) {
  const [visible, setVisible] = useState(false);
  const [query, setQuery] = useState('');
  const { data: breeds = [], isLoading, isError } = useDogBreeds();

  const filtered = useMemo(() => filterDogBreeds(breeds, query), [breeds, query]);

  const selectedLabel =
    breeds.find((b) => b.label === value)?.label ?? (value || '품종을 선택해주세요');

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
          placeholderTextColor={colors.grey}
          autoCorrect={false}
        />

        {isLoading ? (
          <ActivityIndicator style={styles.loader} color={colors.ink} />
        ) : isError ? (
          <Text style={styles.errorText}>품종 목록을 불러오지 못했습니다.</Text>
        ) : (
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
        )}
      </BottomSheet>
    </>
  );
}

const styles = StyleSheet.create({
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.white,
    borderWidth: 1.3,
    borderColor: colors.line,
    borderRadius: radius.md - 2,
    padding: spacing.md - 4,
    marginBottom: spacing.md - 4,
  },
  triggerText: { fontSize: 14, color: colors.ink, flex: 1 },
  placeholder: { color: colors.grey },
  chevron: { fontSize: 16, color: colors.grey, marginLeft: spacing.sm },
  search: {
    backgroundColor: colors.background,
    borderWidth: 1.3,
    borderColor: colors.line,
    borderRadius: radius.md - 2,
    padding: spacing.md - 4,
    fontSize: 14,
    color: colors.ink,
    marginBottom: spacing.sm,
  },
  list: {
    maxHeight: 280,
    marginBottom: spacing.sm,
  },
  loader: { marginVertical: spacing.lg },
  errorText: { textAlign: 'center', color: colors.grey, marginVertical: spacing.lg },
  option: {
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.md - 2,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.line,
  },
  optionActive: { backgroundColor: colors.quoteBg },
  optionText: { fontSize: 14, color: colors.ink },
  optionTextActive: { fontWeight: '700' },
});
