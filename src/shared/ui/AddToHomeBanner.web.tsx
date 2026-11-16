import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  colors,
  spacing,
  radius,
  fontSize,
  fontWeight,
  lineHeight,
  shadows,
  zIndex,
  hitSlop,
} from '@/shared/config/theme';

const DISMISSED_KEY = 'add-to-home-banner-dismissed';
const CLOSE_BUTTON_SIZE = 26;

function isIphoneSafari() {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent;
  const isIphone = /iPhone/.test(ua);
  const isOtherBrowser = /CriOS|FxiOS|EdgiOS|OPiOS/.test(ua);
  return isIphone && /Safari/.test(ua) && !isOtherBrowser;
}

function isStandalone() {
  if (typeof window === 'undefined') return false;
  const standalone = (navigator as Navigator & { standalone?: boolean }).standalone === true;
  return standalone || window.matchMedia('(display-mode: standalone)').matches;
}

function wasDismissed() {
  if (typeof window === 'undefined') return false;
  try {
    return window.localStorage.getItem(DISMISSED_KEY) === '1';
  } catch {
    return false;
  }
}

export function AddToHomeBanner() {
  const insets = useSafeAreaInsets();
  const [visible, setVisible] = useState(
    () => isIphoneSafari() && !isStandalone() && !wasDismissed(),
  );

  const handleDismiss = () => {
    try {
      window.localStorage.setItem(DISMISSED_KEY, '1');
    } catch {
      // 저장이 안 되면 이번 실행에서만 숨긴다
    }
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <View style={[styles.wrap, { bottom: insets.bottom + spacing.md }]}>
      <Pressable
        style={styles.closeBtn}
        onPress={handleDismiss}
        hitSlop={hitSlop}
        accessibilityRole="button"
        accessibilityLabel="닫기"
      >
        <Text style={styles.closeText}>✕</Text>
      </Pressable>
      <Text style={styles.title}>홈 화면에 추가하면 앱처럼 쓸 수 있어요</Text>
      <Text style={styles.body}>
        {"Safari 아래 공유 버튼(⬆️)을 누르고 '홈 화면에 추가'를 선택하세요"}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: spacing.md,
    right: spacing.md,
    zIndex: zIndex.overlay,
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    padding: spacing.md,
    paddingRight: spacing.xl,
    ...shadows.card,
  },
  closeBtn: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    width: CLOSE_BUTTON_SIZE,
    height: CLOSE_BUTTON_SIZE,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeText: {
    fontSize: fontSize.md,
    color: colors.fg,
    fontWeight: fontWeight.bold,
  },
  title: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.bold,
    color: colors.fg,
    marginBottom: spacing.xs,
  },
  body: {
    fontSize: fontSize.md,
    lineHeight: lineHeight.md,
    color: colors.fgSecondary,
  },
});
