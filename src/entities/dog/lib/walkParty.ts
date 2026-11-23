export function formatWalkPartyName(representativeName: string, extraCount: number): string {
  if (extraCount <= 0) return representativeName;
  return `${representativeName} 외 ${extraCount}마리`;
}

/** 대표를 앞에 두고, 나머지는 등록이 빠른 순. 대표는 데려간 강아지 중 홈에서 선택된 강아지다 */
export function orderWalkDogs<T extends { dogId: string; createdAt: string }>(
  dogs: T[],
  selectedDogId: string | null | undefined,
): T[] {
  if (dogs.length === 0) return [];
  const representative =
    dogs.find((dog) => dog.dogId === selectedDogId) ??
    [...dogs].sort((a, b) => a.createdAt.localeCompare(b.createdAt))[0];
  const rest = dogs
    .filter((dog) => dog.dogId !== representative.dogId)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  return [representative, ...rest];
}
