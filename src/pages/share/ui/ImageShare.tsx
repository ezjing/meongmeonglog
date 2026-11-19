import * as Sharing from 'expo-sharing';
import type { ComponentRef, PropsWithChildren, RefObject } from 'react';
import { useRef } from 'react';
import { StyleSheet } from 'react-native';
import ViewShot from 'react-native-view-shot';

import { spacing } from '@/shared/config/theme';
import { Button } from '@/shared/ui/Button';
import { useOverlay } from '@/shared/ui/overlay';

type CaptureRef = RefObject<ComponentRef<typeof ViewShot> | null>;

/** 앱: 공유 카드를 이미지로 캡처해 시스템 공유 시트로 보낸다 */
export function useImageShare() {
  const { showToast } = useOverlay();
  const captureRef: CaptureRef = useRef<ComponentRef<typeof ViewShot>>(null);

  const shareImage = async () => {
    try {
      if (!captureRef.current?.capture) return;
      const uri = await captureRef.current.capture();
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri);
      } else {
        showToast({ message: '이 기기에서는 공유 기능을 사용할 수 없어요', variant: 'warning' });
      }
    } catch {
      showToast({ message: '이미지 저장에 실패했어요', variant: 'error' });
    }
  };

  return { captureRef, shareImage };
}

export function CardCapture({
  captureRef,
  children,
}: PropsWithChildren<{ captureRef: CaptureRef }>) {
  return (
    <ViewShot ref={captureRef} options={{ format: 'png', quality: 1 }}>
      {children}
    </ViewShot>
  );
}

export function ImageShareButtons({ onShare }: { onShare: () => void }) {
  return (
    <>
      <Button label="💬  카카오톡 공유" variant="kakao" onPress={onShare} style={styles.button} />
      <Button
        label="📷  인스타그램 공유"
        variant="instagram"
        onPress={onShare}
        style={styles.button}
      />
      <Button
        label="⬇️  이미지 저장 후 공유"
        variant="secondary"
        onPress={onShare}
        style={styles.button}
      />
    </>
  );
}

const styles = StyleSheet.create({
  button: { marginBottom: spacing.sm },
});
