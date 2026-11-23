import { useSelectedDog } from './useSelectedDog';
import { DEFAULT_DOG_NAME } from '../config/dog';

function resolveDogDisplayName(...candidates: (string | null | undefined)[]): string {
  for (const name of candidates) {
    const trimmed = name?.trim();
    if (trimmed) return trimmed;
  }
  return DEFAULT_DOG_NAME;
}

function useRegisteredDogName(): string | undefined {
  const { dog } = useSelectedDog();
  return dog?.name?.trim() || undefined;
}

export function useDogDisplayName(): string {
  const registered = useRegisteredDogName();
  return resolveDogDisplayName(registered);
}

export function useDiaryDogName(diaryDogName?: string | null): string {
  const registered = useRegisteredDogName();
  return resolveDogDisplayName(diaryDogName, registered);
}
