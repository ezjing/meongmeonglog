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

import {
  colors,
  spacing,
  radius,
  fontSize,
  emojiSize,
  fontWeight,
  opacity,
} from '@/constants/theme';

const NAV_BUTTON_WIDTH = 40;
const NAV_BUTTON_HEIGHT = 48;

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
  const resolvedIndex = Math.min(Math.max(initialIndex, 0), Math.max(uris.length - 1, 0));
  const [trackedIndex, setTrackedIndex] = useState(resolvedIndex);
  const currentIndex = visible ? resolvedIndex : trackedIndex;
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    if (!visible || !hasMultiple) return;

    requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({ x: currentIndex * width, animated: false });
    });
  }, [visible, currentIndex, hasMultiple, width]);

  const goToIndex = (index: number) => {
    const nextIndex = Math.min(Math.max(index, 0), uris.length - 1);
    setTrackedIndex(nextIndex);
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
                    setTrackedIndex(Math.round(event.nativeEvent.contentOffset.x / width));
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
    backgroundColor: colors.scrimStrong,
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
    borderRadius: radius.lg,
  },
  placeholder: {
    borderRadius: radius.lg,
    backgroundColor: colors.apricot,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: {
    fontSize: emojiSize.xl,
  },
  navBtn: {
    position: 'absolute',
    top: '50%',
    marginTop: -spacing.lg,
    width: NAV_BUTTON_WIDTH,
    height: NAV_BUTTON_HEIGHT,
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
    fontSize: emojiSize.lg,
    color: colors.white,
    fontWeight: fontWeight.light,
  },
  navTextDisabled: {
    opacity: opacity.subtle,
  },
  counter: {
    position: 'absolute',
    bottom: spacing.xl * 2,
    color: colors.white,
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
  },
});
