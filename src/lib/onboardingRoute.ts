import type { Href } from 'expo-router';

import { fetchDogs } from '@/lib/api/dogApi';
import { fetchGuardianProfile, isGuardianProfileComplete } from '@/lib/api/userApi';

export async function resolveOnboardingRoute(userId: string): Promise<Href> {
  const profile = await fetchGuardianProfile(userId);
  if (!isGuardianProfileComplete(profile)) {
    return '/(onboarding)/guardianBasic';
  }

  const dogs = await fetchDogs(userId);
  if (dogs.length === 0) {
    return '/(onboarding)/dogBasic';
  }

  return '/(tabs)';
}
