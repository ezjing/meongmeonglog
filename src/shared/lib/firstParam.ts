/** 주소 쿼리 값이 배열로 올 수 있어 첫 값만 쓴다 (expo-router·expo-linking 공통) */
export function firstParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}
