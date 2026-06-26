import { AppError } from '@/lib/AppError';
import { persistAuthSession, clearAuthSession } from '@/lib/authStorage';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
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

export async function signOut(): Promise<void> {
  await clearAuthSession();
  if (isSupabaseConfigured) {
    await supabase.auth.signOut();
  }
}

export async function getCurrentUserId(): Promise<string | null> {
  if (!isSupabaseConfigured) {
    return DEV_AUTH ? 'dev-kakao-user' : null;
  }
  const { data } = await supabase.auth.getUser();
  return data.user?.id ?? null;
}
