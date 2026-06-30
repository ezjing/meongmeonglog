import { Pressable, StyleSheet, View, type ViewProps } from 'react-native';

import { colors } from '@/constants/theme';

interface OverlayBackdropProps extends ViewProps {
  onPress?: () => void;
  children: React.ReactNode;
}

export function OverlayBackdrop({ onPress, children, style, ...props }: OverlayBackdropProps) {
  return (
    <View style={[styles.root, style]} {...props}>
      {onPress ? (
        <Pressable style={StyleSheet.absoluteFill} onPress={onPress} accessibilityRole="button" />
      ) : null}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFill,
    backgroundColor: colors.overlay,
  },
});
