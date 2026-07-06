import { Image } from 'expo-image';
import { useState, type ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { colors, spacing } from '@/constants/theme';
import type { WalkPhoto } from '@/types/domain';

interface WalkPhotoCarouselProps {
  photos: WalkPhoto[];
  width: number;
  height: number;
  borderRadius?: number;
  showDots?: boolean;
  onPhotoPress?: (photo: WalkPhoto, index: number) => void;
  children?: ReactNode;
}

export function WalkPhotoCarousel({
  photos,
  width,
  height,
  borderRadius = 0,
  showDots = true,
  onPhotoPress,
  children,
}: WalkPhotoCarouselProps) {
  const [photoIndex, setPhotoIndex] = useState(0);

  return (
    <View
      style={[
        styles.container,
        { width, height, borderRadius, backgroundColor: colors.clay },
      ]}
    >
      {photos.length > 0 ? (
        <ScrollView
          horizontal
          pagingEnabled
          nestedScrollEnabled
          showsHorizontalScrollIndicator={false}
          style={{ width, height }}
          onMomentumScrollEnd={(e) => {
            setPhotoIndex(Math.round(e.nativeEvent.contentOffset.x / width));
          }}
        >
          {photos.map((photo, index) => (
            <Pressable
              key={photo.id}
              style={{ width, height }}
              onPress={() => onPhotoPress?.(photo, index)}
              disabled={!onPhotoPress}
            >
              <Image
                source={{ uri: photo.imageUrl }}
                style={{ width, height }}
                contentFit="cover"
              />
            </Pressable>
          ))}
        </ScrollView>
      ) : null}

      {children ? (
        <View style={styles.overlay} pointerEvents="box-none">
          {children}
        </View>
      ) : null}

      {showDots && photos.length > 1 ? (
        <View style={styles.dots} pointerEvents="none">
          {photos.map((photo, i) => (
            <View
              key={photo.id}
              style={[styles.dot, i === photoIndex && styles.dotActive]}
            />
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    overflow: 'hidden',
  },
  overlay: {
    ...StyleSheet.absoluteFill,
    zIndex: 1,
  },
  dots: {
    position: 'absolute',
    bottom: spacing.sm,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    zIndex: 2,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
  dotActive: {
    backgroundColor: colors.white,
  },
});
