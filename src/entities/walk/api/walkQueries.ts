import { useQuery } from '@tanstack/react-query';

import {
  fetchActiveWalksForDogs,
  fetchWalk,
  fetchWalkDogIds,
  fetchWalkPeople,
  fetchWalkPhotos,
} from './walkApi';

/** 진행 중 산책 조회. 강아지 id와 상관없이 이 접두로 새로 고친다. */
export const activeWalksQueryKey = ['walks', 'active'] as const;

export const walkKeys = {
  all: ['walks'] as const,
  detail: (walkId: string) => [...walkKeys.all, walkId] as const,
  photos: (walkId: string) => [...walkKeys.all, walkId, 'photos'] as const,
  dogs: (walkId: string) => [...walkKeys.all, walkId, 'dogs'] as const,
  people: (walkId: string) => [...walkKeys.all, walkId, 'people'] as const,
  activeForDogs: (dogIds: string[]) => [...activeWalksQueryKey, ...dogIds] as const,
};

export function useWalk(walkId: string | undefined) {
  return useQuery({
    queryKey: walkKeys.detail(walkId ?? ''),
    queryFn: () => fetchWalk(walkId!),
    enabled: !!walkId,
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
