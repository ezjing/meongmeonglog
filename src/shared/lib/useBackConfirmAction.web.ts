import { useCallback } from 'react';

/** 웹에는 하드웨어 뒤로가기와 Android 종료 확인이 없다. */
export function useBackConfirmAction(_onBack: () => void | Promise<void>, _enabled = true) {
  const allowLeave = useCallback(() => {}, []);
  return { allowLeave };
}
