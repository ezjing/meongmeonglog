import { isAuthApiError, isAuthRetryableFetchError } from '@supabase/supabase-js';

import { stopWalkTracking } from '@/entities/walk';
import type { AuthProvider } from '@/shared/api/database';
import { supabase, isSupabaseConfigured } from '@/shared/api/supabase';
import { AppError } from '@/shared/lib/AppError';

import { DEV_AUTH } from '../config/devAuth';
import { persistAuthSession, clearAuthSession, loadAuthSession } from '../lib/authStorage';
import { unlinkKakaoAccount } from '../lib/kakaoAuth';
import type { AuthSession } from '../model/types';

async function invokeSocialAuth(provider: AuthProvider, body: Record<string, unknown>) {
  if (!isSupabaseConfigured) {
    if (DEV_AUTH) return null;
    throw new AppError('supabase_not_configured', 'Supabase 환경 변수를 설정해주세요.');
  }

  const { data, error } = await supabase.functions.invoke(
    provider === 'naver' ? 'auth-naver' : 'auth-kakao',
    { body: { provider, ...body } },
  );
  const responseError = (data as { error?: string } | null)?.error;
  if (error || responseError) {
    if (DEV_AUTH) return null;
    // 서버·SDK 오류 문구(영어, 내부 정보)는 사용자에게 보여주지 않는다
    if (__DEV__) console.warn('[auth] social auth failed', responseError ?? error);
    throw new AppError('auth_failed', '로그인에 실패했습니다.');
  }
  return data;
}

async function persistSocialSession(
  provider: AuthProvider,
  data: (AuthSession & { refreshToken?: string }) | null,
): Promise<AuthSession> {
  if (!data) return mockDevSession(provider);

  if (data.accessToken) {
    await supabase.auth.setSession({
      access_token: data.accessToken,
      refresh_token: data.refreshToken ?? data.accessToken,
    });
  }

  const authSession = {
    userId: data.userId,
    accessToken: data.accessToken,
    provider: data.provider ?? provider,
  };
  await persistAuthSession({ userId: authSession.userId, provider: authSession.provider });
  return authSession;
}

export async function signInWithProvider(
  provider: AuthProvider,
  accessToken: string,
): Promise<AuthSession> {
  const data = await invokeSocialAuth(provider, { accessToken });
  return persistSocialSession(provider, data as AuthSession & { refreshToken?: string });
}

export async function fetchWebAuthorizeUrl(input: {
  provider: AuthProvider;
  redirectUri: string;
  state: string;
  forceAccountPicker: boolean;
}): Promise<string> {
  const data = await invokeSocialAuth(input.provider, {
    intent: 'authorize',
    redirectUri: input.redirectUri,
    state: input.state,
    forceAccountPicker: input.forceAccountPicker,
  });
  const authorizeUrl = (data as { authorizeUrl?: string } | null)?.authorizeUrl;
  if (!authorizeUrl) {
    throw new AppError('auth_failed', '로그인에 실패했습니다.');
  }
  return authorizeUrl;
}

export async function signInWithAuthCode(input: {
  provider: AuthProvider;
  code: string;
  redirectUri: string;
  state: string;
}): Promise<AuthSession> {
  const data = await invokeSocialAuth(input.provider, {
    code: input.code,
    redirectUri: input.redirectUri,
    state: input.state,
  });
  return persistSocialSession(input.provider, data as AuthSession & { refreshToken?: string });
}

/** 앱에서 브라우저 로그인을 시작할 때: 로그인 주소와 서버가 만든 state·appProof */
export async function fetchAppAuthorize(input: {
  provider: AuthProvider;
  redirectUri: string;
  forceAccountPicker: boolean;
}): Promise<{ authorizeUrl: string; state: string; appProof: string }> {
  const data = (await invokeSocialAuth(input.provider, {
    intent: 'authorize',
    appLogin: true,
    redirectUri: input.redirectUri,
    forceAccountPicker: input.forceAccountPicker,
  })) as { authorizeUrl?: string; state?: string; appProof?: string } | null;
  if (!data?.authorizeUrl || !data.state || !data.appProof) {
    throw new AppError('auth_failed', '로그인에 실패했습니다.');
  }
  return { authorizeUrl: data.authorizeUrl, state: data.state, appProof: data.appProof };
}

/** 앱 브라우저 로그인 결과(암호화된 코드)로 로그인 */
export async function signInWithAppCode(input: {
  provider: AuthProvider;
  sealed: string;
  state: string;
  appProof: string;
  redirectUri: string;
}): Promise<AuthSession> {
  const data = await invokeSocialAuth(input.provider, {
    sealed: input.sealed,
    state: input.state,
    appProof: input.appProof,
    redirectUri: input.redirectUri,
  });
  return persistSocialSession(input.provider, data as AuthSession & { refreshToken?: string });
}

async function mockDevSession(provider: AuthProvider): Promise<AuthSession> {
  const userId = `dev-${provider}-user`;
  const authSession = { userId, accessToken: `dev-token-${provider}`, provider };
  await persistAuthSession({ userId, provider });
  return authSession;
}

/** 진행 중이던 산책(위치 추적·저장 상태)을 정리해 다른 계정에 복원되지 않게 한다 */
async function clearWalkSession(): Promise<void> {
  await stopWalkTracking().catch(() => {});
}

type SupabaseSessionStatus = 'valid' | 'missing' | 'unknown';

/**
 * 앱에 저장된 로그인 사용자와 실제 Supabase 인증 세션이 일치하는지 확인한다.
 * 세션이 없으면 조회가 RLS에 막혀 빈 결과로 돌아오므로, 로그인 상태로 취급하면 안 된다.
 */
export async function checkSupabaseSession(userId: string): Promise<SupabaseSessionStatus> {
  if (!isSupabaseConfigured) return 'valid';
  if (DEV_AUTH && userId.startsWith('dev-')) return 'valid';

  const { data, error } = await supabase.auth.getSession();
  // 오프라인 등 일시적인 실패는 로그아웃시키지 않는다
  if (error && isAuthRetryableFetchError(error)) return 'unknown';
  if (!data.session || data.session.user.id !== userId) return 'missing';

  // 다른 기기 로그인 등으로 서버에서 폐기된 세션은 기기에 저장된 값만으로 알 수 없어 서버에 확인한다
  const { error: userError } = await supabase.auth.getUser();
  if (!userError) return 'valid';
  if (isAuthApiError(userError) && (userError.status === 401 || userError.status === 403)) {
    return 'missing';
  }
  return 'unknown';
}

/** Supabase 세션이 이미 끊긴 경우 서버 호출 없이 기기에 남은 로그인·산책 상태만 정리한다 */
export async function clearLocalAuth(): Promise<void> {
  await clearWalkSession();
  await clearAuthSession();
}

export async function signOut(): Promise<void> {
  await clearLocalAuth();
  if (isSupabaseConfigured) {
    await supabase.auth.signOut();
  }
}

export async function deleteAccount(
  successors: { householdId: string; userId: string }[] = [],
): Promise<void> {
  const storedAuth = await loadAuthSession();

  if (isSupabaseConfigured) {
    const { data, error } = await supabase.functions.invoke('delete-account', {
      body: { successors },
    });
    const responseError = (data as { error?: string } | null)?.error;
    if (error || responseError) {
      // 서버·SDK 오류 문구(영어, 내부 정보)는 사용자에게 보여주지 않는다
      if (__DEV__) console.warn('[auth] delete account failed', responseError ?? error);
      throw new AppError('delete_account_failed', '계정 삭제에 실패했습니다.');
    }
  }

  // 서버도 카카오 연결을 끊는다. 앱 SDK 호출은 배포 전 서버를 대비해 그대로 둔다.
  // 네이버는 앱에 토큰을 두지 않아 연동 해제를 하지 않는다 (사용자가 네이버 설정에서 해제)
  if (storedAuth?.provider === 'kakao') {
    await unlinkKakaoAccount();
  }

  await signOut();
}

/**
 * 소셜 로그인으로 받은 실제 이메일 (public.users.email).
 * Auth 이메일은 소셜 고유 ID 기반 대체 주소라 표시용으로 쓰지 않는다.
 */
export async function getCurrentUserEmail(userId: string): Promise<string | null> {
  if (!isSupabaseConfigured) return null;

  const { data } = await supabase.from('users').select('email').eq('id', userId).maybeSingle();
  const email = (data?.email as string | null | undefined) ?? null;
  if (!email || email.endsWith('@meongmeonglog.dev')) return null;
  return email;
}
