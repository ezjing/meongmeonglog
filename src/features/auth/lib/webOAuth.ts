import type { AuthProvider } from '@/shared/api/database';
import { AppError } from '@/shared/lib/AppError';

import { fetchWebAuthorizeUrl } from '../api/authApi';

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

function browserStorage(): Storage {
  const storage = (globalThis as { sessionStorage?: Storage }).sessionStorage;
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

  if (params.error) throw new Error('로그인이 취소되었습니다.');

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
