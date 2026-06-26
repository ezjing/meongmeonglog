import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { colors, spacing } from '@/constants/theme';

interface LoadingPawsProps {
  message: string;
}

export function LoadingPaws({ message }: LoadingPawsProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.paws}>🐾 🐾 🐾</Text>
      <ActivityIndicator color={colors.apricot} style={styles.spinner} />
      <Text style={styles.message}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  paws: {
    fontSize: 24,
    marginBottom: spacing.md,
  },
  spinner: {
    marginBottom: spacing.md,
  },
  message: {
    fontSize: 14,
    color: colors.grey,
    textAlign: 'center',
  },
});
