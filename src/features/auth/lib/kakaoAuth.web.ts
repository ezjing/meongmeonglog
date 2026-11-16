import { DEV_AUTH } from '../config/devAuth';

export function initKakaoSdk() {}

export async function unlinkKakaoAccount(): Promise<void> {}

export async function getKakaoAccessToken(): Promise<string> {
  if (DEV_AUTH) return 'dev';
  throw new Error('카카오 로그인은 모바일 앱에서만 지원됩니다.');
}
