import { AppError } from '@/lib/AppError';
import { dogBreedLabelsKo, popularBreedsKo } from '@/constants/dogBreedLabels';

const DOG_CEO_BREEDS_URL = 'https://dog.ceo/api/breeds/list/all';

type DogCeoBreedsResponse = {
  message: Record<string, string[]>;
  status: string;
};

function flattenBreeds(data: Record<string, string[]>): string[] {
  const breeds: string[] = [];
  for (const [breed, subBreeds] of Object.entries(data)) {
    if (subBreeds.length === 0) {
      breeds.push(breed);
      continue;
    }
    for (const sub of subBreeds) {
      breeds.push(`${breed}/${sub}`);
    }
  }
  return breeds;
}

function formatBreedLabel(breedKey: string): string {
  return dogBreedLabelsKo[breedKey] ?? breedKey.replace(/\//g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

export interface DogBreedOption {
  key: string;
  label: string;
}

let cachedBreeds: DogBreedOption[] | null = null;

export async function fetchDogBreeds(): Promise<DogBreedOption[]> {
  if (cachedBreeds) return cachedBreeds;

  const response = await fetch(DOG_CEO_BREEDS_URL);
  if (!response.ok) {
    throw new AppError('breed_fetch_failed', '품종 목록을 불러오지 못했습니다.');
  }

  const json = (await response.json()) as DogCeoBreedsResponse;
  const apiKeys = flattenBreeds(json.message);

  const apiOptions: DogBreedOption[] = apiKeys.map((key) => ({
    key,
    label: formatBreedLabel(key),
  }));

  const popularSet = new Set(popularBreedsKo.map((b) => b.key));
  const popularOptions = popularBreedsKo.filter((b) => b.key === '믹스견' || b.key === '기타');
  const restFromApi = apiOptions
    .filter((b) => !popularSet.has(b.key))
    .sort((a, b) => a.label.localeCompare(b.label, 'ko'));

  cachedBreeds = [...popularOptions, ...restFromApi];
  return cachedBreeds;
}

export function filterBreeds(breeds: DogBreedOption[], query: string): DogBreedOption[] {
  const q = query.trim().toLowerCase();
  if (!q) return breeds;
  return breeds.filter((b) => b.label.toLowerCase().includes(q) || b.key.toLowerCase().includes(q));
}
