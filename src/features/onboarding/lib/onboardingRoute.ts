import type { Href } from 'expo-router';

import { fetchDogs } from '@/entities/dog';
import { fetchGuardianProfile, isGuardianProfileComplete } from '@/entities/guardian';

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
