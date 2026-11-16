import { StyleSheet, Text, type StyleProp, type TextStyle } from 'react-native';

import { colors, fontSize, spacing } from '@/shared/config/theme';

const NOTICE =
  '웹에서는 이 화면이 켜져 있는 동안만 경로가 기록돼요. 화면을 끄거나 다른 앱으로 나가면 그 구간은 빠집니다.';

export function WebWalkRecordingNotice({ style }: { style?: StyleProp<TextStyle> }) {
  return <Text style={[styles.notice, style]}>{NOTICE}</Text>;
}

const styles = StyleSheet.create({
  notice: {
    textAlign: 'center',
    color: colors.fgSecondary,
    fontSize: fontSize.base,
    paddingHorizontal: spacing.sm,
  },
});
