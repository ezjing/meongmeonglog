import { SymbolView } from 'expo-symbols';
import { Pressable, StyleSheet, Text, View, type ViewStyle } from 'react-native';

import { colors, spacing } from '@/constants/theme';

interface StackAppBarProps {
  title: string;
  onBackPress: () => void;
  onSharePress?: () => void;
  style?: ViewStyle;
}

const sideSize = 36;

export function StackAppBar({
  title,
  onBackPress,
  onSharePress,
  style,
}: StackAppBarProps) {
  return (
    <View style={[styles.bar, style]}>
      <Pressable
        style={({ pressed }) => [styles.circleBtn, pressed && styles.pressed]}
        onPress={onBackPress}
        accessibilityRole="button"
        accessibilityLabel="뒤로"
      >
        <Text style={styles.backIcon}>‹</Text>
      </Pressable>

      <Text style={styles.title} numberOfLines={1}>
        {title}
      </Text>

      {onSharePress ? (
        <Pressable
          style={({ pressed }) => [
            styles.circleBtn,
            styles.rightAction,
            pressed && styles.pressed,
          ]}
          onPress={onSharePress}
          accessibilityRole="button"
          accessibilityLabel="공유"
        >
          <SymbolView
            name={{ ios: 'square.and.arrow.up', android: 'share', web: 'share' }}
            size={16}
            tintColor={colors.ink}
          />
        </Pressable>
      ) : (
        <View style={[styles.sidePlaceholder, styles.rightAction]} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    backgroundColor: colors.background,
    position: 'relative',
  },
  circleBtn: {
    width: sideSize,
    height: sideSize,
    borderRadius: sideSize / 2,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.line,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  backIcon: {
    fontSize: 22,
    lineHeight: 24,
    fontWeight: '700',
    color: colors.ink,
    marginTop: -2,
  },
  title: {
    position: 'absolute',
    left: spacing.md + sideSize,
    right: spacing.md + sideSize,
    textAlign: 'center',
    fontWeight: '700',
    fontSize: 14,
    color: colors.ink,
  },
  sidePlaceholder: {
    width: sideSize,
    height: sideSize,
  },
  rightAction: {
    marginLeft: 'auto',
  },
  pressed: {
    opacity: 0.85,
  },
});
