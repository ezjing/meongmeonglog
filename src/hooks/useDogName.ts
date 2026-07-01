import { DEFAULT_DOG_NAME } from '@/constants/dog';
import { useDogs } from '@/hooks/useAuthSession';

export function resolveDogDisplayName(
  ...candidates: (string | null | undefined)[]
): string {
  for (const name of candidates) {
    const trimmed = name?.trim();
    if (trimmed) return trimmed;
  }
  return DEFAULT_DOG_NAME;
}

export function useRegisteredDogName(): string | undefined {
  const { data: dogs } = useDogs();
  return dogs?.[0]?.name?.trim() || undefined;
}

export function useDogDisplayName(): string {
  const registered = useRegisteredDogName();
  return resolveDogDisplayName(registered);
}

export function useDiaryDogName(diaryDogName?: string | null): string {
  const registered = useRegisteredDogName();
  return resolveDogDisplayName(diaryDogName, registered);
}
