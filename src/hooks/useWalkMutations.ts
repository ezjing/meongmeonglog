import { useMutation, useQuery } from '@tanstack/react-query';

import { AnalyticsEvents, trackEvent } from '@/lib/analytics';
import {
  startWalk,
  finishWalk,
  cancelWalk,
  saveWalkEvent,
  uploadWalkPhotos,
  fetchWalk,
  fetchWalkPhotos,
  type WalkWeatherPayload,
} from '@/lib/api/walkApi';
import type { WalkEvent } from '@/types/domain';

export const walkKeys = {
  all: ['walks'] as const,
  detail: (walkId: string) => [...walkKeys.all, walkId] as const,
  photos: (walkId: string) => [...walkKeys.all, walkId, 'photos'] as const,
};

export function useWalk(walkId: string | undefined) {
  return useQuery({
    queryKey: walkKeys.detail(walkId ?? ''),
    queryFn: () => fetchWalk(walkId!),
    enabled: !!walkId,
  });
}

export function useStartWalk() {
  return useMutation({
    mutationFn: ({ dogId, weather }: { dogId: string; weather?: WalkWeatherPayload }) =>
      startWalk(dogId, weather),
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
