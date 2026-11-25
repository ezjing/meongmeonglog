import { useMutation, useQueryClient } from '@tanstack/react-query';

import { AnalyticsEvents, trackEvent } from '@/shared/lib/analytics';

import {
  cancelWalk,
  deleteDiaryFromWalk,
  finishWalk,
  startWalk,
  uploadWalkPhotos,
} from './walkApi';
import { walkKeys } from './walkQueries';

export function useStartWalk() {
  return useMutation({
    mutationFn: ({ dogIds }: { dogIds: string[] }) => startWalk(dogIds),
    onSuccess: () => trackEvent(AnalyticsEvents.walkStarted),
  });
}

export function useFinishWalk() {
  return useMutation({
    mutationFn: ({
      walkId,
      payload,
    }: {
      walkId: string;
      payload: Parameters<typeof finishWalk>[1];
    }) => finishWalk(walkId, payload),
    onSuccess: () => trackEvent(AnalyticsEvents.walkFinished),
  });
}

export function useCancelWalk() {
  return useMutation({
    mutationFn: cancelWalk,
  });
}

export function useDeleteDiaryFromWalk() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ diaryId, walkId }: { diaryId: string; walkId: string }) =>
      deleteDiaryFromWalk(diaryId, walkId),
    onSuccess: (_data, { walkId }) => {
      queryClient.removeQueries({ queryKey: walkKeys.detail(walkId) });
      queryClient.removeQueries({ queryKey: walkKeys.photos(walkId) });
    },
  });
}

export function useUploadWalkPhotos() {
  return useMutation({
    mutationFn: ({ walkId, uris }: { walkId: string; uris: string[] }) =>
      uploadWalkPhotos(walkId, uris),
  });
}
