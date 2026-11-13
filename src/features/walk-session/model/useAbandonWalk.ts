import { useCallback } from 'react';

import { stopWalkTracking, useCancelWalk, useWalkStore } from '@/entities/walk';

import { useFinishWalkStore } from './finishWalkStore';

/** 진행 중인 산책을 기록하지 않고 버린다: 서버 기록 삭제 → 위치 추적 중지 → 상태 초기화 (화면 이동은 호출한 쪽에서) */
export function useAbandonWalk() {
  const cancelWalk = useCancelWalk();

  const abandonWalk = useCallback(
    async (walkId: string) => {
      await cancelWalk.mutateAsync(walkId);
      await stopWalkTracking();
      useWalkStore.getState().reset();
      useFinishWalkStore.getState().reset();
    },
    [cancelWalk],
  );

  return { abandonWalk, isAbandoning: cancelWalk.isPending };
}
