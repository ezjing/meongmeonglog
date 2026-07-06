export type DogBreedDefinition = {
  key: string;
  label: string;
  englishName?: string;
};

/** docs/dogbreed.json 기반 품종 목록 */
export const dogBreeds: DogBreedDefinition[] = [
  { key: "golden-retriever", label: "골든 리트리버", englishName: "Golden Retriever" },
  { key: "goldendoodle", label: "골든두들", englishName: "Goldendoodle" },
  { key: "greyhound", label: "그레이하운드", englishName: "Greyhound" },
  { key: "coton-de-tulear", label: "꼬동 드 툴레아", englishName: "Coton de Tulear" },
  { key: "dachshund", label: "닥스훈트", englishName: "Dachshund" },
  { key: "dalmatian", label: "달마시안", englishName: "Dalmatian" },
  { key: "doberman-pinscher", label: "도베르만 핀셔", englishName: "Doberman Pinscher" },
  { key: "labrador-retriever", label: "래브라도 리트리버", englishName: "Labrador Retriever" },
  { key: "maltese", label: "말티즈", englishName: "Maltese" },
  { key: "maltipoo", label: "말티푸", englishName: "Maltipoo" },
  { key: "manchester-terrier", label: "맨체스터 테리어", englishName: "Manchester Terrier" },
  { key: "miniature-pinscher", label: "미니추어 핀셔 (미니핀)", englishName: "Miniature Pinscher" },
  { key: "mixed-breed", label: "믹스견", englishName: "Mixed Breed" },
  { key: "bedlington-terrier", label: "베들링턴 테리어", englishName: "Bedlington Terrier" },
  { key: "border-collie", label: "보더 콜리", englishName: "Border Collie" },
  { key: "boston-terrier", label: "보스턴 테리어", englishName: "Boston Terrier" },
  { key: "volpino-italiano", label: "볼피노", englishName: "Volpino Italiano" },
  { key: "bulldog", label: "불독", englishName: "Bulldog" },
  { key: "beagle", label: "비글", englishName: "Beagle" },
  { key: "bichon-frise", label: "비숑 프리제", englishName: "Bichon Frise" },
  { key: "papillon", label: "빠삐용", englishName: "Papillon" },
  { key: "samoyed", label: "사모예드", englishName: "Samoyed" },
  { key: "sapsali", label: "삽살개", englishName: "Sapsali" },
  { key: "shar-pei", label: "샤페이", englishName: "Shar Pei" },
  { key: "shetland-sheepdog", label: "셰틀랜드 쉽독 (셀티)", englishName: "Shetland Sheepdog" },
  { key: "miniature-schnauzer", label: "슈나우저", englishName: "Miniature Schnauzer" },
  { key: "japanese-spitz", label: "스피츠", englishName: "Japanese Spitz" },
  { key: "shiba-inu", label: "시바이누 (시바견)", englishName: "Shiba Inu" },
  { key: "siberian-husky", label: "시베리안 허스키", englishName: "Siberian Husky" },
  { key: "shih-poo", label: "시치푸", englishName: "Shih-Poo" },
  { key: "shih-tzu", label: "시츄", englishName: "Shih Tzu" },
  { key: "american-cocker-spaniel", label: "아메리칸 코카 스파니엘", englishName: "American Cocker Spaniel" },
  { key: "irish-setter", label: "아이리시 세터", englishName: "Irish Setter" },
  { key: "akita", label: "아키타견", englishName: "Akita" },
  { key: "alaskan-malamute", label: "알래스칸 말라뮤트", englishName: "Alaskan Malamute" },
  { key: "chow-chow", label: "양갱이 (차우차우)", englishName: "Chow Chow" },
  { key: "airedale-terrier", label: "에어데일 테리어", englishName: "Airedale Terrier" },
  { key: "welsh-corgi", label: "웰시 코기", englishName: "Welsh Corgi" },
  { key: "yorkshire-terrier", label: "요크셔 테리어", englishName: "Yorkshire Terrier" },
  { key: "italian-greyhound", label: "이탈리안 그레이하운드", englishName: "Italian Greyhound" },
  { key: "jack-russell-terrier", label: "재크 러셀 테리어", englishName: "Jack Russell Terrier" },
  { key: "jindo", label: "진돗개", englishName: "Jindo" },
  { key: "chihuahua", label: "치와와", englishName: "Chihuahua" },
  { key: "cavalier-king-charles-spaniel", label: "카발리에 킹 찰스 스패니얼", englishName: "Cavalier King Charles Spaniel" },
  { key: "pug", label: "퍼그", englishName: "Pug" },
  { key: "pekingese", label: "페키니즈", englishName: "Pekingese" },
  { key: "pomeranian", label: "포메라니안", englishName: "Pomeranian" },
  { key: "pomsky", label: "포마스키", englishName: "Pomsky" },
  { key: "poodle", label: "푸들", englishName: "Poodle" },
  { key: "french-bulldog", label: "프렌치 불독", englishName: "French Bulldog" },
];

export type DogBreedOption = Pick<DogBreedDefinition, "key" | "label">;

export const dogBreedOptions: DogBreedOption[] = dogBreeds
  .map(({ key, label }) => ({ key, label }))
  .sort((a, b) => a.label.localeCompare(b.label, "ko"));

export function filterDogBreeds(
  breeds: DogBreedOption[],
  query: string,
): DogBreedOption[] {
  const q = query.trim().toLowerCase();
  if (!q) return breeds;
  return breeds.filter(
    (b) => b.label.toLowerCase().includes(q) || b.key.toLowerCase().includes(q),
  );
}

export const dogBreedLabelByKey = Object.fromEntries(
  dogBreeds.map((breed) => [breed.key, breed.label]),
) as Record<string, string>;

export const englishNameToBreedKey = Object.fromEntries(
  dogBreeds
    .filter((breed): breed is DogBreedDefinition & { englishName: string } =>
      Boolean(breed.englishName),
    )
    .map((breed) => [breed.englishName, breed.key]),
) as Record<string, string>;
