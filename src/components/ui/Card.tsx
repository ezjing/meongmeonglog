import { StyleSheet, View, type ViewProps } from 'react-native';

import { colors, spacing, radius, shadows } from '@/constants/theme';

export function Card({ style, children, ...props }: ViewProps) {
  return (
    <View style={[styles.card, style]} {...props}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: spacing.ms,
    ...shadows.card,
  },
});
