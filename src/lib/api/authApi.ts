import { AppError } from '@/lib/AppError';
import { persistAuthSession, clearAuthSession, loadAuthSession } from '@/lib/authStorage';
import { unlinkKakaoAccount } from '@/lib/kakaoAuth';
import { unlinkNaverAccount } from '@/lib/naverAuth';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { stopWalkTracking } from '@/lib/walk/walkLocationService';
import type { AuthProvider } from '@/types/database';
import type { AuthSession } from '@/types/domain';

const DEV_AUTH = process.env.EXPO_PUBLIC_DEV_AUTH === 'true';

export async function signInWithProvider(
  provider: AuthProvider,
  accessToken: string,
): Promise<AuthSession> {
  if (!isSupabaseConfigured) {
    if (DEV_AUTH) {
      return mockDevSession(provider);
    }
    throw new AppError('supabase_not_configured', 'Supabase 환경 변수를 설정해주세요.');
  }

  const { data, error } = await supabase.functions.invoke(
    provider === 'naver' ? 'auth-naver' : 'auth-kakao',
    { body: { provider, accessToken } },
  );

  const responseError = (data as { error?: string } | null)?.error;
  if (error || responseError) {
    if (DEV_AUTH) {
      return mockDevSession(provider);
    }
    throw new AppError('auth_failed', responseError ?? error?.message ?? '로그인에 실패했습니다.');
  }

  const session = data as AuthSession & { refreshToken?: string };
  if (session.accessToken) {
    await supabase.auth.setSession({
      access_token: session.accessToken,
      refresh_token: session.refreshToken ?? session.accessToken,
    });
  }

  const authSession = {
    userId: session.userId,
    accessToken: session.accessToken,
    provider: session.provider ?? provider,
  };

  await persistAuthSession({ userId: authSession.userId, provider: authSession.provider });
  return authSession;
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

export async function signOut(): Promise<void> {
  await clearWalkSession();
  await clearAuthSession();
  if (isSupabaseConfigured) {
    await supabase.auth.signOut();
  }
}

export async function deleteAccount(): Promise<void> {
  const storedAuth = await loadAuthSession();

  if (isSupabaseConfigured) {
    const { data, error } = await supabase.functions.invoke('delete-account');
    const responseError = (data as { error?: string } | null)?.error;
    if (error || responseError) {
      throw new AppError(
        'delete_account_failed',
        responseError ?? error?.message ?? '계정 삭제에 실패했습니다.',
      );
    }
  }

  if (storedAuth?.provider === 'naver') {
    await unlinkNaverAccount();
  } else if (storedAuth?.provider === 'kakao') {
    await unlinkKakaoAccount();
  }

  await clearWalkSession();
  await clearAuthSession();
  if (isSupabaseConfigured) {
    await supabase.auth.signOut();
  }
}

/**
 * 소셜 로그인으로 받은 실제 이메일 (public.users.email).
 * Auth 이메일은 소셜 고유 ID 기반 대체 주소라 표시용으로 쓰지 않는다.
 */
export async function getCurrentUserEmail(): Promise<string | null> {
  if (!isSupabaseConfigured) return null;
  const { data: authData } = await supabase.auth.getUser();
  const userId = authData.user?.id;
  if (!userId) return null;

  const { data } = await supabase.from('users').select('email').eq('id', userId).maybeSingle();
  const email = (data?.email as string | null | undefined) ?? null;
  if (!email || email.endsWith('@meongmeonglog.dev')) return null;
  return email;
}

export async function getCurrentUserId(): Promise<string | null> {
  if (!isSupabaseConfigured) {
    return DEV_AUTH ? 'dev-kakao-user' : null;
  }
  const { data } = await supabase.auth.getUser();
  return data.user?.id ?? null;
}
