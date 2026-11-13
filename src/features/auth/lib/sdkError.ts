/** 네이티브 모듈이 없는 환경(Expo Go 등)에서 소셜 SDK를 호출하면 나는 에러를 안내 문구로 바꾼다 */
export function toSdkNotLinkedError(error: unknown): Error | null {
  if (error instanceof Error && error.message.includes("doesn't seem to be linked")) {
    return new Error('Dev Client로 앱을 빌드해주세요. (npx expo run:ios 또는 run:android)');
  }
  return null;
}
