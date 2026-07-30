import { useEffect, useMemo, useState } from 'react';
import { AppState } from 'react-native';

export function getElapsedSecFromStartedAt(startedAt: string | null | undefined): number {
  if (!startedAt) return 0;
  return Math.max(0, Math.floor((Date.now() - new Date(startedAt).getTime()) / 1000));
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
