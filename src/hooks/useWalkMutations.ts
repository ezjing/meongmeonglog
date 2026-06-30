import { useMutation } from '@tanstack/react-query';

import {
  startWalk,
  finishWalk,
  cancelWalk,
  saveWalkEvent,
  uploadWalkPhotos,
  fetchWalkPhotos,
} from '@/lib/api/walkApi';
import { AnalyticsEvents, trackEvent } from '@/lib/analytics';
import type { WalkEvent } from '@/types/domain';

export const walkKeys = {
  all: ['walks'] as const,
  photos: (walkId: string) => [...walkKeys.all, walkId, 'photos'] as const,
};

export function useStartWalk() {
  return useMutation({
    mutationFn: startWalk,
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

export function useSaveWalkEvent() {
  return useMutation({
    mutationFn: ({ walkId, event }: { walkId: string; event: WalkEvent }) =>
      saveWalkEvent(walkId, event),
  });
}

export function useUploadWalkPhotos() {
  return useMutation({
    mutationFn: ({ walkId, uris }: { walkId: string; uris: string[] }) =>
      uploadWalkPhotos(walkId, uris),
  });
}

export { fetchWalkPhotos };
