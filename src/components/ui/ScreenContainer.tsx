import { StyleSheet, Text, View } from 'react-native';

import { colors, radius, spacing } from '@/constants/theme';

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
    fontSize: 18,
    fontWeight: '800',
    color: colors.ink,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: 12,
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
    borderLeftWidth: 4,
    borderLeftColor: colors.apricot,
    borderRadius: radius.sm,
    padding: spacing.md - 4,
    marginVertical: spacing.sm,
  },
  text: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.apricotDark,
  },
});
