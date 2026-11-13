import { StyleSheet, Text, TextInput, View } from 'react-native';

import {
  colors,
  spacing,
  radius,
  fontSize,
  fontWeight,
  lineHeight,
  borderWidth,
} from '@/shared/config/theme';

const MULTILINE_MIN_HEIGHT = 72;

interface GuardianProfileFormValues {
  guardianTitle: string;
  parentingStyle: string;
  currentConcern: string;
}

interface GuardianProfileFieldsProps {
  values: GuardianProfileFormValues;
  onChange: (values: Partial<GuardianProfileFormValues>) => void;
  /** 입력칸에 포커스될 때 (키보드에 가리지 않게 스크롤할 때 사용) */
  onFieldFocus?: () => void;
}

export function GuardianProfileFields({
  values,
  onChange,
  onFieldFocus,
}: GuardianProfileFieldsProps) {
  const displayTitle = values.guardianTitle.trim() || '엄마';

  return (
    <>
      <View style={styles.field}>
        <Text style={styles.label}>호칭</Text>
        <TextInput
          style={styles.input}
          value={values.guardianTitle}
          onChangeText={(text) => onChange({ guardianTitle: text })}
          onFocus={onFieldFocus}
          placeholder="엄마, 아빠, 언니, OO님"
          placeholderTextColor={colors.fgSubtle}
        />
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>양육 스타일/가치관</Text>
        <TextInput
          style={styles.input}
          value={values.parentingStyle}
          onChangeText={(text) => onChange({ parentingStyle: text })}
          onFocus={onFieldFocus}
          placeholder="자유로운 영혼, 엄격한 훈련파, 사랑 듬뿍 애정파"
          placeholderTextColor={colors.fgSubtle}
        />
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>현재 고민</Text>
        <TextInput
          style={[styles.input, styles.multilineInput]}
          value={values.currentConcern}
          onChangeText={(text) => onChange({ currentConcern: text })}
          onFocus={onFieldFocus}
          placeholder="분리불안, 산책 매너, 편식"
          placeholderTextColor={colors.fgSubtle}
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
    color: colors.fgSecondary,
    marginBottom: spacing.xs,
  },
  input: {
    backgroundColor: colors.surface,
    borderWidth: borderWidth.medium,
    borderColor: colors.border,
    borderRadius: radius.control,
    paddingVertical: spacing.ms,
    paddingHorizontal: spacing.ms,
    fontSize: fontSize.md,
    color: colors.fg,
  },
  multilineInput: {
    minHeight: MULTILINE_MIN_HEIGHT,
    textAlignVertical: 'top',
  },
  relationNote: {
    backgroundColor: colors.primarySubtle,
    borderRadius: radius.cardSm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.ms,
    marginTop: spacing.xxs,
  },
  relationNoteText: {
    fontSize: fontSize.xs,
    color: colors.primaryFg,
    lineHeight: lineHeight.sm,
  },
});
