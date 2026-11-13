import { StyleSheet, View } from 'react-native';

import { colors, spacing } from '@/shared/config/theme';

import { LoadingOverlayCard } from './LoadingOverlay';

interface LoadingPawsProps {
  message: string;
  subtitle?: string;
}

export function LoadingPaws({ message, subtitle }: LoadingPawsProps) {
  return (
    <View style={styles.container}>
      <LoadingOverlayCard title={message} subtitle={subtitle} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
    backgroundColor: colors.background,
  },
});
