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
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import {
  colors,
  spacing,
  radius,
  fontSize,
  emojiSize,
  fontWeight,
  opacity,
} from '@/shared/config/theme';

import { ZoomableImage } from './ZoomableImage';

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
  const [currentIndex, setCurrentIndex] = useState(resolvedIndex);
  const [prevVisible, setPrevVisible] = useState(visible);
  const [zoomed, setZoomed] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  // 열릴 때마다 누른 사진부터, 원래 크기로 보여준다
  if (visible !== prevVisible) {
    setPrevVisible(visible);
    setZoomed(false);
    if (visible) setCurrentIndex(resolvedIndex);
  }

  useEffect(() => {
    if (!visible || !hasMultiple) return;

    requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({ x: resolvedIndex * width, animated: false });
    });
  }, [visible, resolvedIndex, hasMultiple, width]);

  const goToIndex = (index: number) => {
    const nextIndex = Math.min(Math.max(index, 0), uris.length - 1);
    setCurrentIndex(nextIndex);
    setZoomed(false);
    scrollRef.current?.scrollTo({ x: nextIndex * width, animated: true });
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      {/* Modal은 앱 루트 밖에 그려지므로 제스처용 루트를 다시 감싼다 (Android) */}
      <GestureHandlerRootView style={styles.backdrop}>
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
                  scrollEnabled={!zoomed}
                  style={styles.carousel}
                  onMomentumScrollEnd={(event) => {
                    setCurrentIndex(Math.round(event.nativeEvent.contentOffset.x / width));
                  }}
                >
                  {uris.map((uri, index) => (
                    <View key={`${uri}-${index}`} style={[styles.page, { width }]}>
                      <ZoomableImage
                        uri={uri}
                        size={imageSize}
                        isActive={index === currentIndex}
                        panEnabled={zoomed && index === currentIndex}
                        onZoomChange={setZoomed}
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
              <ZoomableImage
                uri={uris[0]}
                size={imageSize}
                isActive
                panEnabled={zoomed}
                onZoomChange={setZoomed}
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
      </GestureHandlerRootView>
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
