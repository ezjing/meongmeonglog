import { DEV_AUTH } from '../config/devAuth';

export function initNaverSdk() {}

export async function unlinkNaverAccount(): Promise<void> {}

export async function getNaverAccessToken(): Promise<string> {
  if (DEV_AUTH) return 'dev';
  throw new Error('네이버 로그인은 모바일 앱에서만 지원됩니다.');
}
