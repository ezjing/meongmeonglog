import { StyleSheet, View, type ViewProps } from 'react-native';

import { colors, spacing, radius, shadows } from '@/shared/config/theme';

export function Card({ style, children, ...props }: ViewProps) {
  return (
    <View style={[styles.card, style]} {...props}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    padding: spacing.ms,
    ...shadows.card,
  },
});
