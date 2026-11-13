import { Image } from 'expo-image';
import { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { radius } from '@/shared/config/theme';

const MAX_SCALE = 4;
const DOUBLE_TAP_SCALE = 2;
const RESET_DURATION_MS = 200;

interface ZoomableImageProps {
  uri: string;
  size: number;
  /** 현재 보이는 사진인지. 다른 사진으로 넘어가면 확대 상태를 초기화한다 */
  isActive: boolean;
  /** 확대 상태에서만 드래그 이동을 켠다 (원래 크기에서는 캐러셀 좌우 넘기기에 양보) */
  panEnabled: boolean;
  onZoomChange: (zoomed: boolean) => void;
}

function clamp(value: number, min: number, max: number) {
  'worklet';
  return Math.min(Math.max(value, min), max);
}

/** 핀치 확대, 확대 중 드래그 이동, 더블탭 확대/원복을 지원하는 정사각형 이미지 */
export function ZoomableImage({
  uri,
  size,
  isActive,
  panEnabled,
  onZoomChange,
}: ZoomableImageProps) {
  const scale = useSharedValue(1);
  const startScale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const startX = useSharedValue(0);
  const startY = useSharedValue(0);

  useEffect(() => {
    if (isActive) return;
    scale.set(1);
    translateX.set(0);
    translateY.set(0);
  }, [isActive, scale, translateX, translateY]);

  // 확대된 사진의 가장자리가 원래 영역 안쪽으로 들어오지 않도록 이동 범위를 제한
  const clampTranslate = (value: number, currentScale: number) => {
    'worklet';
    const max = (size * (currentScale - 1)) / 2;
    return clamp(value, -max, max);
  };

  const resetZoom = () => {
    'worklet';
    scale.set(withTiming(1, { duration: RESET_DURATION_MS }));
    translateX.set(withTiming(0, { duration: RESET_DURATION_MS }));
    translateY.set(withTiming(0, { duration: RESET_DURATION_MS }));
    scheduleOnRN(onZoomChange, false);
  };

  const pinch = Gesture.Pinch()
    .onStart(() => {
      startScale.set(scale.get());
    })
    .onUpdate((event) => {
      const next = clamp(startScale.get() * event.scale, 1, MAX_SCALE);
      scale.set(next);
      translateX.set(clampTranslate(translateX.get(), next));
      translateY.set(clampTranslate(translateY.get(), next));
    })
    .onEnd(() => {
      if (scale.get() <= 1) {
        resetZoom();
        return;
      }
      scheduleOnRN(onZoomChange, true);
    });

  const pan = Gesture.Pan()
    .enabled(panEnabled)
    .averageTouches(true)
    .onStart(() => {
      startX.set(translateX.get());
      startY.set(translateY.get());
    })
    .onUpdate((event) => {
      translateX.set(clampTranslate(startX.get() + event.translationX, scale.get()));
      translateY.set(clampTranslate(startY.get() + event.translationY, scale.get()));
    });

  const doubleTap = Gesture.Tap()
    .numberOfTaps(2)
    .onEnd((event, success) => {
      if (!success) return;
      if (scale.get() > 1) {
        resetZoom();
        return;
      }

      // 탭한 지점이 확대 후에도 같은 자리에 오도록 이동량을 계산 (원래 크기에서는 좌표 변환이 없음)
      const offsetX = event.x - size / 2;
      const offsetY = event.y - size / 2;
      scale.set(withTiming(DOUBLE_TAP_SCALE, { duration: RESET_DURATION_MS }));
      translateX.set(
        withTiming(clampTranslate(offsetX * (1 - DOUBLE_TAP_SCALE), DOUBLE_TAP_SCALE), {
          duration: RESET_DURATION_MS,
        }),
      );
      translateY.set(
        withTiming(clampTranslate(offsetY * (1 - DOUBLE_TAP_SCALE), DOUBLE_TAP_SCALE), {
          duration: RESET_DURATION_MS,
        }),
      );
      scheduleOnRN(onZoomChange, true);
    });

  const gesture = Gesture.Race(doubleTap, Gesture.Simultaneous(pinch, pan));

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.get() },
      { translateY: translateY.get() },
      { scale: scale.get() },
    ],
  }));

  return (
    <GestureDetector gesture={gesture}>
      <Animated.View style={[{ width: size, height: size }, animatedStyle]}>
        <Image source={{ uri }} style={styles.image} contentFit="contain" />
      </Animated.View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  image: {
    width: '100%',
    height: '100%',
    borderRadius: radius.card,
  },
});
