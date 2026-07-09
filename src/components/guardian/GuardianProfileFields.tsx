import { StyleSheet, Text, TextInput, View } from 'react-native';

import { colors, radius, spacing } from '@/constants/theme';

export interface GuardianProfileFormValues {
  guardianTitle: string;
  parentingStyle: string;
  currentConcern: string;
}

interface GuardianProfileFieldsProps {
  values: GuardianProfileFormValues;
  onChange: (values: Partial<GuardianProfileFormValues>) => void;
}

export function GuardianProfileFields({ values, onChange }: GuardianProfileFieldsProps) {
  const displayTitle = values.guardianTitle.trim() || '엄마';

  return (
    <>
      <View style={styles.field}>
        <Text style={styles.label}>호칭</Text>
        <TextInput
          style={styles.input}
          value={values.guardianTitle}
          onChangeText={(text) => onChange({ guardianTitle: text })}
          placeholder="엄마, 아빠, 언니, OO님"
          placeholderTextColor={colors.grey}
        />
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>양육 스타일/가치관</Text>
        <TextInput
          style={styles.input}
          value={values.parentingStyle}
          onChangeText={(text) => onChange({ parentingStyle: text })}
          placeholder="자유로운 영혼, 엄격한 훈련파, 사랑 듬뿍 애정파"
          placeholderTextColor={colors.grey}
        />
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>현재 고민</Text>
        <TextInput
          style={[styles.input, styles.multilineInput]}
          value={values.currentConcern}
          onChangeText={(text) => onChange({ currentConcern: text })}
          placeholder="분리불안, 산책 매너, 편식"
          placeholderTextColor={colors.grey}
          multiline
        />
      </View>

      <View style={styles.relationNote}>
        <Text style={styles.relationNoteText}>
          🐾 &quot;오늘은 {displayTitle}랑 공원에 다녀왔어!&quot; — 입력한 호칭이 일기 속에 그대로
          등장해요
        </Text>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  field: {
    marginBottom: 11,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    color: '#5b5b66',
    marginBottom: 5,
  },
  input: {
    backgroundColor: colors.white,
    borderWidth: 1.3,
    borderColor: colors.line,
    borderRadius: radius.md - 2,
    paddingVertical: 11,
    paddingHorizontal: 12,
    fontSize: 12.5,
    color: colors.ink,
  },
  multilineInput: {
    minHeight: 72,
    textAlignVertical: 'top',
  },
  relationNote: {
    backgroundColor: colors.quoteBg,
    borderRadius: radius.sm,
    paddingVertical: 8,
    paddingHorizontal: 10,
    marginTop: 2,
  },
  relationNoteText: {
    fontSize: 10,
    color: colors.apricotDark,
    lineHeight: 15,
  },
});
