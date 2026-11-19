import type { AuthProvider } from '@/shared/api/database';
import { AppError } from '@/shared/lib/AppError';

import { fetchWebAuthorizeUrl } from '../api/authApi';
import { loginCancelledError } from './loginCancelled';

const PENDING_KEY = 'web-oauth-pending';

interface PendingOAuth {
  provider: AuthProvider;
  state: string;
}

interface WebOAuthCallback {
  provider: AuthProvider;
  code: string;
  redirectUri: string;
  state: string;
}

/**
 * 홈 화면 앱(standalone)에서는 로그인 페이지가 Safari로 열렸다가 돌아오면서 sessionStorage가 달라질 수 있어
 * localStorage에 둔다. 콜백에서 읽자마자 지우므로 한 번만 쓰인다.
 */
function browserStorage(): Storage {
  const storage = (globalThis as { localStorage?: Storage }).localStorage;
  if (!storage) throw new AppError('auth_failed', '로그인에 실패했습니다.');
  return storage;
}

function callbackUri(): string {
  const origin = (globalThis as { location?: { origin: string } }).location?.origin;
  if (!origin) throw new AppError('auth_failed', '로그인에 실패했습니다.');
  return `${origin}/callback`;
}

export async function startWebOAuth(provider: AuthProvider, forceAccountPicker = false) {
  const state = crypto.randomUUID();
  const pending: PendingOAuth = { provider, state };
  browserStorage().setItem(PENDING_KEY, JSON.stringify(pending));

  const authorizeUrl = await fetchWebAuthorizeUrl({
    provider,
    redirectUri: callbackUri(),
    state,
    forceAccountPicker,
  });
  (globalThis as { location: { assign: (url: string) => void } }).location.assign(authorizeUrl);
}

export function readWebOAuthCallback(params: {
  code?: string;
  state?: string;
  error?: string;
}): WebOAuthCallback {
  const storage = browserStorage();
  const raw = storage.getItem(PENDING_KEY);
  storage.removeItem(PENDING_KEY);

  // 동의 거절·창 닫기는 취소, 그 밖의 제공자 오류는 실패로 보여준다
  if (params.error === 'access_denied') throw loginCancelledError();
  if (params.error) throw new AppError('auth_failed', '로그인에 실패했습니다.');

  let pending: PendingOAuth | null = null;
  try {
    pending = raw ? (JSON.parse(raw) as PendingOAuth) : null;
  } catch {
    pending = null;
  }
  if (!pending || !params.code || params.state !== pending.state) {
    throw new AppError('auth_failed', '로그인에 실패했습니다.');
  }

  return {
    provider: pending.provider,
    code: params.code,
    redirectUri: callbackUri(),
    state: params.state,
  };
}
