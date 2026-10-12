import { StyleSheet, Text, TextInput, View } from 'react-native';

import {
  colors,
  spacing,
  radius,
  fontSize,
  fontWeight,
  lineHeight,
  borderWidth,
} from '@/constants/theme';

const MULTILINE_MIN_HEIGHT = 72;

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
    marginBottom: spacing.ms,
  },
  label: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    color: colors.inkSoft,
    marginBottom: spacing.xs,
  },
  input: {
    backgroundColor: colors.white,
    borderWidth: borderWidth.medium,
    borderColor: colors.line,
    borderRadius: radius.md,
    paddingVertical: spacing.ms,
    paddingHorizontal: spacing.ms,
    fontSize: fontSize.md,
    color: colors.ink,
  },
  multilineInput: {
    minHeight: MULTILINE_MIN_HEIGHT,
    textAlignVertical: 'top',
  },
  relationNote: {
    backgroundColor: colors.quoteBg,
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.ms,
    marginTop: spacing.xxs,
  },
  relationNoteText: {
    fontSize: fontSize.xs,
    color: colors.apricotDark,
    lineHeight: lineHeight.sm,
  },
});
