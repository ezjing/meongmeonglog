import { StyleSheet, Text, View } from 'react-native';

import { colors, spacing, radius, fontSize, fontWeight, borderWidth } from '@/shared/config/theme';

export function QuoteCard({ quote }: { quote: string }) {
  return (
    <View style={quoteStyles.card}>
      <Text style={quoteStyles.text}>🐾 오늘의 한마디 : {quote}</Text>
    </View>
  );
}

const quoteStyles = StyleSheet.create({
  card: {
    backgroundColor: colors.primarySubtle,
    borderLeftWidth: borderWidth.heavy,
    borderLeftColor: colors.primary,
    borderRadius: radius.cardSm,
    padding: spacing.ms,
    marginVertical: spacing.sm,
  },
  text: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.bold,
    color: colors.primaryFg,
  },
});
