import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { AnalyticsEvents, trackEvent } from '@/shared/lib/analytics';

import {
  startWalk,
  finishWalk,
  cancelWalk,
  deleteDiaryFromWalk,
  uploadWalkPhotos,
  fetchWalk,
  fetchWalkPhotos,
  fetchWalkDogIds,
  fetchWalkPeople,
  fetchActiveWalksForDogs,
} from './walkApi';

const walkKeys = {
  all: ['walks'] as const,
  detail: (walkId: string) => [...walkKeys.all, walkId] as const,
  photos: (walkId: string) => [...walkKeys.all, walkId, 'photos'] as const,
  dogs: (walkId: string) => [...walkKeys.all, walkId, 'dogs'] as const,
  people: (walkId: string) => [...walkKeys.all, walkId, 'people'] as const,
  activeForDogs: (dogIds: string[]) => [...walkKeys.all, 'active', ...dogIds] as const,
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

export function useWalkDogIds(walkId: string | undefined) {
  return useQuery({
    queryKey: walkKeys.dogs(walkId ?? ''),
    queryFn: () => fetchWalkDogIds(walkId!),
    enabled: !!walkId,
  });
}

/** 기록한 사람·같이 간 가족. 일기 상세 칩에서 쓴다. */
export function useWalkPeople(walkId: string | undefined) {
  return useQuery({
    queryKey: walkKeys.people(walkId ?? ''),
    queryFn: () => fetchWalkPeople(walkId!),
    enabled: !!walkId,
  });
}

/** 다른 가족이 진행 중인 강아지. 홈에 들어올 때마다 다시 확인한다. */
export function useActiveWalksForDogs(dogIds: string[]) {
  return useQuery({
    queryKey: walkKeys.activeForDogs(dogIds),
    queryFn: () => fetchActiveWalksForDogs(dogIds),
    enabled: dogIds.length > 0,
    staleTime: 0,
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
