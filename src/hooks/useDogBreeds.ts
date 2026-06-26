import { useQuery } from '@tanstack/react-query';

import { fetchDogBreeds } from '@/lib/api/breedApi';

export const breedKeys = {
  all: ['dogBreeds'] as const,
  list: () => [...breedKeys.all, 'list'] as const,
};

export function useDogBreeds() {
  return useQuery({
    queryKey: breedKeys.list(),
    queryFn: fetchDogBreeds,
    staleTime: 1000 * 60 * 60 * 24,
  });
}
