import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { filterBreeds, type DogBreedOption } from '@/lib/api/breedApi';
import { useDogBreeds } from '@/hooks/useDogBreeds';
import { colors, radius, spacing } from '@/constants/theme';

interface BreedPickerProps {
  value: string;
  onSelect: (breed: string) => void;
}

export function BreedPicker({ value, onSelect }: BreedPickerProps) {
  const [visible, setVisible] = useState(false);
  const [query, setQuery] = useState('');
  const { data: breeds = [], isLoading, isError } = useDogBreeds();

  const filtered = useMemo(() => filterBreeds(breeds, query), [breeds, query]);

  const selectedLabel =
    breeds.find((b) => b.label === value)?.label ?? (value || '품종을 선택해주세요');

  const handleSelect = (option: DogBreedOption) => {
    onSelect(option.label);
    setVisible(false);
    setQuery('');
  };

  return (
    <>
      <Pressable style={styles.trigger} onPress={() => setVisible(true)}>
        <Text style={[styles.triggerText, !value && styles.placeholder]}>{selectedLabel}</Text>
        <Text style={styles.chevron}>⌄</Text>
      </Pressable>

      <Modal visible={visible} animationType="slide" transparent onRequestClose={() => setVisible(false)}>
        <View style={styles.overlay}>
          <View style={styles.sheet}>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>품종 선택</Text>
              <Pressable onPress={() => setVisible(false)}>
                <Text style={styles.close}>닫기</Text>
              </Pressable>
            </View>

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
          </View>
        </View>
      </Modal>
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
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.background,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    maxHeight: '80%',
    paddingBottom: spacing.lg,
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  sheetTitle: { fontSize: 16, fontWeight: '800', color: colors.ink },
  close: { fontSize: 14, color: colors.grey, fontWeight: '600' },
  search: {
    margin: spacing.md,
    backgroundColor: colors.white,
    borderWidth: 1.3,
    borderColor: colors.line,
    borderRadius: radius.md - 2,
    padding: spacing.md - 4,
    fontSize: 14,
    color: colors.ink,
  },
  loader: { marginVertical: spacing.lg },
  errorText: { textAlign: 'center', color: colors.grey, marginVertical: spacing.lg },
  option: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md - 2,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.line,
  },
  optionActive: { backgroundColor: colors.clay },
  optionText: { fontSize: 14, color: colors.ink },
  optionTextActive: { fontWeight: '700' },
});
