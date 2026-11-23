import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { AnalyticsEvents, trackEvent } from '@/shared/lib/analytics';

import {
  startWalk,
  finishWalk,
  cancelWalk,
  deleteWalk,
  saveWalkEvent,
  uploadWalkPhotos,
  fetchWalk,
  fetchWalkPhotos,
} from './walkApi';
import type { WalkEvent } from '../model/types';

const walkKeys = {
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
    mutationFn: ({ dogId }: { dogId: string }) => startWalk(dogId),
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

export function useDeleteWalk() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteWalk,
    onSuccess: (_data, walkId) => {
      queryClient.removeQueries({ queryKey: walkKeys.detail(walkId) });
      queryClient.removeQueries({ queryKey: walkKeys.photos(walkId) });
    },
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

/** 산책 사진 (서버). 일기 생성 화면 등에서 같은 walkId면 캐시를 함께 쓴다 */
export function useWalkPhotosQuery(walkId: string | undefined) {
  return useQuery({
    queryKey: walkKeys.photos(walkId ?? ''),
    queryFn: () => fetchWalkPhotos(walkId!),
    enabled: !!walkId,
  });
}
