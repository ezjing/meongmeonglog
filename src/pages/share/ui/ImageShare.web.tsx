import type { PropsWithChildren } from 'react';

/** 웹에서는 카드 캡처 공유를 보여주지 않는다 (링크 공유만) */
export function useImageShare() {
  return { captureRef: null, shareImage: () => {} };
}

export function CardCapture({ children }: PropsWithChildren<{ captureRef: unknown }>) {
  return <>{children}</>;
}

export function ImageShareButtons(_props: { onShare: () => void }) {
  return null;
}
