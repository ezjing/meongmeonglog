import type { Href } from 'expo-router';

import { dogKeys, fetchDogs } from '@/entities/dog';
import { fetchGuardianProfile, guardianKeys, isGuardianProfileComplete } from '@/entities/guardian';
import { queryClient } from '@/shared/api/queryClient';

// 화면 hook(useGuardianProfile, useDogs)과 같은 query key로 조회해, 이동한 화면이 캐시를 그대로 쓰게 한다

/** 강아지 등록 여부로 다음 화면을 정한다 (보호자 정보는 완료된 상태) */
export async function resolveDogOnboardingRoute(userId: string): Promise<Href> {
  const dogs = await queryClient.fetchQuery({
    queryKey: dogKeys.list(userId),
    queryFn: () => fetchDogs(userId),
  });
  return dogs.length === 0 ? '/(onboarding)/dogBasic' : '/(tabs)';
}

export async function resolveOnboardingRoute(userId: string): Promise<Href> {
  // 대부분은 온보딩을 마친 사용자라 강아지 조회를 함께 시작한다 (순서대로 기다리지 않음)
  const [profile, dogRoute] = await Promise.all([
    queryClient.fetchQuery({
      queryKey: guardianKeys.profile(userId),
      queryFn: () => fetchGuardianProfile(userId),
    }),
    resolveDogOnboardingRoute(userId),
  ]);
  if (!isGuardianProfileComplete(profile)) {
    return '/(onboarding)/guardianBasic';
  }
  return dogRoute;
}
