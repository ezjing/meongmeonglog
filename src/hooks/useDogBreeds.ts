import { useQuery } from '@tanstack/react-query';

import { dogBreedOptions } from '@/constants/dogBreedLabels';

export const breedKeys = {
  all: ['dogBreeds'] as const,
  list: () => [...breedKeys.all, 'list'] as const,
};

export function useDogBreeds() {
  return useQuery({
    queryKey: breedKeys.list(),
    queryFn: async () => dogBreedOptions,
    staleTime: Number.POSITIVE_INFINITY,
    initialData: dogBreedOptions,
  });
}
