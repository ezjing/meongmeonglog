/**
 * 앱으로 들어오는 링크를 화면 이동 전에 거른다.
 * 브라우저 로그인의 복귀 주소(meongmeonglog://oauth-callback)는 expo-web-browser가 처리하므로 화면을 이동하지 않는다.
 */
export function redirectSystemPath({ path }: { path: string; initial: boolean }): string | null {
  try {
    if (path.includes('oauth-callback')) return null;
    return path;
  } catch {
    return path;
  }
}
