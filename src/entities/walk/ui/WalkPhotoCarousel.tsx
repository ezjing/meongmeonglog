import { Image } from 'expo-image';
import { useState, type ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { colors, spacing, radius, zIndex } from '@/shared/config/theme';
import { pageIndexFromOffset } from '@/shared/lib/pageIndexFromOffset';

import type { WalkPhoto } from '../model/types';

const DOT_SIZE = 6;

interface WalkPhotoCarouselProps {
  photos: WalkPhoto[];
  width: number;
  height: number;
  onPhotoPress?: (photo: WalkPhoto, index: number) => void;
  children?: ReactNode;
}

export function WalkPhotoCarousel({
  photos,
  width,
  height,
  onPhotoPress,
  children,
}: WalkPhotoCarouselProps) {
  const [photoIndex, setPhotoIndex] = useState(0);

  return (
    <View style={[styles.container, { width, height, backgroundColor: colors.surfacePlaceholder }]}>
      {photos.length > 0 ? (
        <ScrollView
          horizontal
          pagingEnabled
          nestedScrollEnabled
          showsHorizontalScrollIndicator={false}
          scrollEventThrottle={16}
          style={{ width, height }}
          onScroll={(event) => {
            const nextIndex = pageIndexFromOffset(
              event.nativeEvent.contentOffset.x,
              width,
              photos.length,
            );
            setPhotoIndex((current) => (current === nextIndex ? current : nextIndex));
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

      {photos.length > 1 ? (
        <View style={styles.dots} pointerEvents="none">
          {photos.map((photo, i) => (
            <View key={photo.id} style={[styles.dot, i === photoIndex && styles.dotActive]} />
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
    zIndex: zIndex.base,
  },
  dots: {
    position: 'absolute',
    bottom: spacing.sm,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.sm,
    zIndex: zIndex.raised,
  },
  dot: {
    width: DOT_SIZE,
    height: DOT_SIZE,
    borderRadius: radius.full,
    backgroundColor: colors.fgOnMediaMuted,
  },
  dotActive: {
    backgroundColor: colors.fgOnMedia,
  },
});
