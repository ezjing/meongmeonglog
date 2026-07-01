import { useEffect, useRef, type ReactNode } from 'react';
import {
  Animated,
  Easing,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { colors, spacing } from '@/constants/theme';

interface LoadingOverlayCardProps {
  title: string;
  subtitle?: string;
}

function LoadingSpinner() {
  const spin = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.timing(spin, {
        toValue: 1,
        duration: 850,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );
    animation.start();
    return () => animation.stop();
  }, [spin]);

  return (
    <Animated.View
      style={[
        styles.spinner,
        {
          transform: [
            {
              rotate: spin.interpolate({
                inputRange: [0, 1],
                outputRange: ['0deg', '360deg'],
              }),
            },
          ],
        },
      ]}
    />
  );
}

function PawBounce() {
  const paws = [
    useRef(new Animated.Value(0)).current,
    useRef(new Animated.Value(0)).current,
    useRef(new Animated.Value(0)).current,
    useRef(new Animated.Value(0)).current,
  ];

  useEffect(() => {
    const bounce = (anim: Animated.Value) =>
      Animated.sequence([
        Animated.timing(anim, {
          toValue: 1,
          duration: 275,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(anim, {
          toValue: 0,
          duration: 275,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]);

    const animation = Animated.loop(Animated.stagger(140, paws.map(bounce)));
    animation.start();
    return () => animation.stop();
  }, [paws]);

  return (
    <View style={styles.pawRow}>
      {paws.map((anim, index) => (
        <Animated.Text
          key={index}
          style={[
            styles.paw,
            {
              opacity: anim.interpolate({
                inputRange: [0, 1],
                outputRange: [0.28, 1],
              }),
              transform: [
                {
                  translateY: anim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, -4],
                  }),
                },
              ],
            },
          ]}
        >
          🐾
        </Animated.Text>
      ))}
    </View>
  );
}

export function LoadingOverlayCard({ title, subtitle }: LoadingOverlayCardProps) {
  return (
    <View style={styles.card}>
      <LoadingSpinner />
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      <PawBounce />
    </View>
  );
}

interface LoadingOverlayProps {
  title: string;
  subtitle?: string;
  visible?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function LoadingOverlay({
  title,
  subtitle,
  visible = true,
  style,
}: LoadingOverlayProps) {
  if (!visible) return null;

  return (
    <View style={[styles.overlay, style]} pointerEvents="auto">
      <View style={styles.center}>
        <LoadingOverlayCard title={title} subtitle={subtitle} />
      </View>
    </View>
  );
}

interface LoadingOverlayScreenProps {
  title: string;
  subtitle?: string;
  children?: ReactNode;
  loading?: boolean;
}

export function LoadingOverlayScreen({
  title,
  subtitle,
  children,
  loading = true,
}: LoadingOverlayScreenProps) {
  return (
    <View style={styles.screen}>
      <View style={[styles.backdrop, loading && styles.backdropDim]}>{children}</View>
      <LoadingOverlay title={title} subtitle={subtitle} visible={loading} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  backdrop: {
    flex: 1,
  },
  backdropDim: {
    opacity: 0.94,
  },
  overlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: colors.overlay,
    zIndex: 10,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  card: {
    width: '78%',
    backgroundColor: colors.white,
    borderRadius: 20,
    paddingVertical: 28,
    paddingHorizontal: 22,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 24 },
    shadowOpacity: 0.35,
    shadowRadius: 22,
    elevation: 8,
  },
  spinner: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 4,
    borderColor: colors.line,
    borderTopColor: colors.apricot,
  },
  title: {
    marginTop: 14,
    marginBottom: 4,
    fontSize: 14.5,
    fontWeight: '800',
    color: colors.ink,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 10.5,
    color: colors.grey,
    textAlign: 'center',
  },
  pawRow: {
    flexDirection: 'row',
    gap: 7,
    justifyContent: 'center',
    marginTop: 14,
  },
  paw: {
    fontSize: 16,
  },
});
