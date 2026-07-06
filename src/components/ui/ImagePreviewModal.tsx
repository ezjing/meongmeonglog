import { Image } from 'expo-image';
import { useEffect, useRef, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';

import { colors, spacing } from '@/constants/theme';

interface ImagePreviewModalProps {
  visible: boolean;
  imageUri?: string | null;
  imageUris?: string[];
  initialIndex?: number;
  placeholderEmoji?: string;
  onClose: () => void;
}

export function ImagePreviewModal({
  visible,
  imageUri,
  imageUris,
  initialIndex = 0,
  placeholderEmoji = '🐶',
  onClose,
}: ImagePreviewModalProps) {
  const { width, height } = useWindowDimensions();
  const imageSize = Math.min(width, height) - spacing.xl * 2;
  const uris = imageUris?.length ? imageUris : imageUri ? [imageUri] : [];
  const hasMultiple = uris.length > 1;
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    if (!visible) return;
    const index = Math.min(Math.max(initialIndex, 0), Math.max(uris.length - 1, 0));
    setCurrentIndex(index);
    if (hasMultiple) {
      requestAnimationFrame(() => {
        scrollRef.current?.scrollTo({ x: index * width, animated: false });
      });
    }
  }, [visible, initialIndex, uris.length, hasMultiple, width]);

  const goToIndex = (index: number) => {
    const nextIndex = Math.min(Math.max(index, 0), uris.length - 1);
    setCurrentIndex(nextIndex);
    scrollRef.current?.scrollTo({ x: nextIndex * width, animated: true });
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityRole="button" />

        <View style={styles.content} pointerEvents="box-none">
          {uris.length > 0 ? (
            hasMultiple ? (
              <>
                <ScrollView
                  ref={scrollRef}
                  horizontal
                  pagingEnabled
                  showsHorizontalScrollIndicator={false}
                  style={styles.carousel}
                  onMomentumScrollEnd={(event) => {
                    setCurrentIndex(Math.round(event.nativeEvent.contentOffset.x / width));
                  }}
                >
                  {uris.map((uri, index) => (
                    <View key={`${uri}-${index}`} style={[styles.page, { width }]}>
                      <Image
                        source={{ uri }}
                        style={[styles.image, { width: imageSize, height: imageSize }]}
                        contentFit="contain"
                      />
                    </View>
                  ))}
                </ScrollView>

                <Pressable
                  style={[styles.navBtn, styles.navPrev]}
                  onPress={() => goToIndex(currentIndex - 1)}
                  disabled={currentIndex === 0}
                  accessibilityLabel="이전 사진"
                >
                  <Text style={[styles.navText, currentIndex === 0 && styles.navTextDisabled]}>
                    ‹
                  </Text>
                </Pressable>

                <Pressable
                  style={[styles.navBtn, styles.navNext]}
                  onPress={() => goToIndex(currentIndex + 1)}
                  disabled={currentIndex === uris.length - 1}
                  accessibilityLabel="다음 사진"
                >
                  <Text
                    style={[
                      styles.navText,
                      currentIndex === uris.length - 1 && styles.navTextDisabled,
                    ]}
                  >
                    ›
                  </Text>
                </Pressable>
              </>
            ) : (
              <Image
                source={{ uri: uris[0] }}
                style={[styles.image, { width: imageSize, height: imageSize }]}
                contentFit="contain"
              />
            )
          ) : (
            <View style={[styles.placeholder, { width: imageSize, height: imageSize }]}>
              <Text style={styles.emoji}>{placeholderEmoji}</Text>
            </View>
          )}
        </View>

        {hasMultiple ? (
          <Text style={styles.counter}>
            {currentIndex + 1} / {uris.length}
          </Text>
        ) : null}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  carousel: {
    width: '100%',
  },
  page: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    borderRadius: 16,
  },
  placeholder: {
    borderRadius: 16,
    backgroundColor: colors.apricot,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: {
    fontSize: 96,
  },
  navBtn: {
    position: 'absolute',
    top: '50%',
    marginTop: -24,
    width: 40,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navPrev: {
    left: spacing.sm,
  },
  navNext: {
    right: spacing.sm,
  },
  navText: {
    fontSize: 36,
    color: colors.white,
    fontWeight: '300',
  },
  navTextDisabled: {
    opacity: 0.35,
  },
  counter: {
    position: 'absolute',
    bottom: spacing.xl * 2,
    color: colors.white,
    fontSize: 13,
    fontWeight: '600',
  },
});
