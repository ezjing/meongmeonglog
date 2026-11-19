import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';

import type { AuthProvider } from '@/shared/api/database';
import { WEB_ORIGIN } from '@/shared/config/links';
import { AppError } from '@/shared/lib/AppError';

import { loginCancelledError } from './loginCancelled';
import { fetchAppAuthorize } from '../api/authApi';

/** 네이버·카카오 콘솔에 등록된 웹 콜백. 서버(+middleware)가 앱 주소로 다시 보낸다 */
const APP_LOGIN_REDIRECT_URI = `${WEB_ORIGIN}/callback`;
// src/app/+middleware.ts의 APP_CALLBACK_URL과 같아야 한다
const APP_RETURN_URL = 'meongmeonglog://oauth-callback';

export interface AppOAuthResult {
  provider: AuthProvider;
  sealed: string;
  state: string;
  appProof: string;
  redirectUri: string;
}

function firstParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

/**
 * 앱에서 브라우저(Custom Tab)로 소셜 로그인을 연다.
 * 인가 코드는 서버가 암호화해서 돌려주고, 이 앱만 가진 appProof가 있어야 풀 수 있다.
 */
export async function startAppOAuth(
  provider: AuthProvider,
  forceAccountPicker = false,
): Promise<AppOAuthResult> {
  const { authorizeUrl, state, appProof } = await fetchAppAuthorize({
    provider,
    redirectUri: APP_LOGIN_REDIRECT_URI,
    forceAccountPicker,
  });

  const result = await WebBrowser.openAuthSessionAsync(authorizeUrl, APP_RETURN_URL);
  if (result.type !== 'success') throw loginCancelledError();

  const { queryParams } = Linking.parse(result.url);
  const returnedState = firstParam(queryParams?.state as string | string[] | undefined);
  const sealed = firstParam(queryParams?.sealed as string | string[] | undefined);
  const error = firstParam(queryParams?.error as string | string[] | undefined);

  if (returnedState !== state) throw new AppError('auth_failed', '로그인에 실패했습니다.');
  if (error === 'cancelled' || error === 'access_denied') {
    throw loginCancelledError();
  }
  if (error || !sealed) throw new AppError('auth_failed', '로그인에 실패했습니다.');

  return { provider, sealed, state, appProof, redirectUri: APP_LOGIN_REDIRECT_URI };
}
