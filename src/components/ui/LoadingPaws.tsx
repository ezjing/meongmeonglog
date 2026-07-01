import { StyleSheet, View } from 'react-native';

import { LoadingOverlayCard } from '@/components/ui/LoadingOverlay';
import { colors, spacing } from '@/constants/theme';

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
