import { StyleSheet, Text, View } from 'react-native';

import { colors, spacing, radius, fontSize, fontWeight, borderWidth } from '@/constants/theme';

export function QuoteCard({ quote }: { quote: string }) {
  return (
    <View style={quoteStyles.card}>
      <Text style={quoteStyles.text}>🐾 오늘의 한마디 : {quote}</Text>
    </View>
  );
}

const quoteStyles = StyleSheet.create({
  card: {
    backgroundColor: colors.quoteBg,
    borderLeftWidth: borderWidth.heavy,
    borderLeftColor: colors.apricot,
    borderRadius: radius.md,
    padding: spacing.ms,
    marginVertical: spacing.sm,
  },
  text: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.bold,
    color: colors.apricotDark,
  },
});
