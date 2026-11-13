import { useEffect, useMemo, useState } from 'react';
import { AppState } from 'react-native';

export function getElapsedSecFromStartedAt(startedAt: string | null | undefined): number {
  if (!startedAt) return 0;
  return Math.max(0, Math.floor((Date.now() - new Date(startedAt).getTime()) / 1000));
}

/** 일시정지(종료 화면 진입 등)로 고정된 시간이 있으면 그 값을, 없으면 시작 시각부터 지금까지 */
export function getWalkElapsedSec(
  frozenElapsedSec: number | null,
  startedAt: string | null | undefined,
): number {
  return frozenElapsedSec ?? getElapsedSecFromStartedAt(startedAt);
}

export function useElapsedSec(startedAt: string | null | undefined): number {
  const [elapsedSec, setElapsedSec] = useState(0);

  useEffect(() => {
    if (!startedAt) return;

    const update = () => setElapsedSec(getElapsedSecFromStartedAt(startedAt));
    update();

    const interval = setInterval(update, 1000);
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') update();
    });

    return () => {
      clearInterval(interval);
      subscription.remove();
    };
  }, [startedAt]);

  return useMemo(() => (startedAt ? elapsedSec : 0), [elapsedSec, startedAt]);
}
