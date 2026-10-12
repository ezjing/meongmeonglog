import { StyleSheet, Text, View } from 'react-native';

import { colors, spacing, radius, fontSize, fontWeight, borderWidth } from '@/constants/theme';

interface ScreenContainerProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
}

export function ScreenContainer({ children, title, subtitle }: ScreenContainerProps) {
  return (
    <View style={styles.container}>
      {title ? <Text style={styles.title}>{title}</Text> : null}
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.md,
  },
  title: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.extrabold,
    color: colors.ink,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: fontSize.md,
    color: colors.grey,
    marginBottom: spacing.md,
  },
});

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
