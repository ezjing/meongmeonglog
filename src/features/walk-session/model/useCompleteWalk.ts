import {
  getWalkDogIds,
  loadPersistedWalkState,
  saveWalkEvents,
  stopWalkTracking,
  useFinishWalk,
  useUploadWalkPhotos,
  useWalkStore,
  type WalkSession,
} from '@/entities/walk';

import type { FinishWalkForm } from './finishWalkStore';
import { getWalkElapsedSec } from './useElapsedSec';
import { flushAllPendingDbLocations } from '../lib/walkLocationProcessor';

/**
 * 산책 종료 저장: 남은 좌표 전송 → 종료·이벤트·사진 저장(동시) → 위치 추적 중지 → 상태 초기화.
 * 화면 이동·안내는 호출한 쪽에서 한다. 실패하면 예외를 던지고 진행 중 산책은 그대로 둔다.
 */
export function useCompleteWalk() {
  const finishWalk = useFinishWalk();
  const uploadPhotos = useUploadWalkPhotos();

  const complete = async (activeWalk: WalkSession, form: FinishWalkForm): Promise<void> => {
    await flushAllPendingDbLocations();
    const { distanceMeter, frozenElapsedSec } = useWalkStore.getState();
    const persisted = await loadPersistedWalkState();
    const finalDistance = persisted?.distanceMeter ?? distanceMeter;
    const finalDuration = getWalkElapsedSec(frozenElapsedSec, activeWalk.startedAt);

    const dogIds = getWalkDogIds(activeWalk);
    const [, , uploaded] = await Promise.all([
      finishWalk.mutateAsync({
        walkId: activeWalk.walkId,
        payload: {
          endedAt: new Date().toISOString(),
          distanceMeter: Math.round(finalDistance),
          durationSec: finalDuration,
          weatherCondition: activeWalk.weatherCondition ?? undefined,
          weatherTemp: activeWalk.weatherTemp ?? undefined,
          weatherIcon: activeWalk.weatherIcon ?? undefined,
        },
      }),
      saveWalkEvents(
        activeWalk.walkId,
        dogIds.map((dogId) => {
          const entry = form.eventsByDogId[dogId];
          return {
            dogId,
            event: {
              peeCount: entry?.peeSelected ? 1 : 0,
              poopCount: entry?.poopSelected ? 1 : 0,
              dogMeetingLevel: entry?.dogMeetingLevel ?? 'NONE',
              memo: form.memo || null,
            },
          };
        }),
      ),
      uploadPhotos.mutateAsync({ walkId: activeWalk.walkId, uris: form.photoUris }),
    ]);

    useWalkStore.getState().setPendingWalkPhotos(activeWalk.walkId, uploaded);
    await stopWalkTracking();
    useWalkStore.getState().reset();
  };

  return { complete };
}
