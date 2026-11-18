/// <reference path="./deno.d.ts" />

import type { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';

import { createAppLoginState, isAppLoginState, openAppLoginCode, sealAppLoginCode } from './appLogin.ts';
import { serveJson } from './http.ts';
import { createAdminClient } from './requestUser.ts';
import type { SocialOAuth } from './socialOAuth.ts';

export type SocialProvider = 'kakao' | 'naver';

export interface SocialProfile {
  provider: SocialProvider;
  /** 카카오 회원번호 / 네이버 고유 식별자 */
  providerUserId: string;
  /** 인증된 실제 이메일 (표시용). 계정 매칭에는 쓰지 않는다. */
  email: string | null;
  nickname: string;
  profileImage: string | null;
}

/** 소셜 고유 ID 기반 Supabase Auth 이메일 (provider 간 계정이 합쳐지지 않도록) */
function toAuthEmail(provider: SocialProvider, providerUserId: string) {
  return `${provider}-${providerUserId}@meongmeonglog.dev`.toLowerCase();
}

async function findAuthUserIdByEmail(supabaseAdmin: SupabaseClient, email: string) {
  // 007 마이그레이션의 DB 함수로 한 번에 찾는다
  const { data, error } = await supabaseAdmin.rpc('find_auth_user_id_by_email', {
    target_email: email,
  });
  if (!error) return (data as string | null) ?? null;

  // 마이그레이션 적용 전이면 이전 방식(전체 사용자 순회)으로 찾는다
  console.error('[auth] find_auth_user_id_by_email 실패, 전체 조회로 대체', error.message);
  const target = email.toLowerCase();
  let page = 1;
  while (true) {
    const { data: list, error: listError } = await supabaseAdmin.auth.admin.listUsers({
      page,
      perPage: 1000,
    });
    if (listError) throw listError;

    const existing = list.users.find((user) => user.email?.toLowerCase() === target);
    if (existing?.id) return existing.id as string;

    if (list.users.length < 1000) break;
    page += 1;
  }
  return null;
}

/**
 * 소셜 고유 ID 도입 전, 실제 이메일로 Auth 계정을 만든 기존 회원을 찾아
 * Auth 이메일을 고유 ID 기반으로 옮긴다. 같은 로그인 수단으로 가입한 계정만 연결한다.
 */
async function migrateLegacyUser(
  supabaseAdmin: SupabaseClient,
  profile: SocialProfile,
  authEmail: string,
) {
  if (!profile.email) return null;

  const { data: legacy, error } = await supabaseAdmin
    .from('users')
    .select('id')
    .eq('provider', profile.provider)
    .eq('email', profile.email)
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  if (!legacy?.id) return null;

  const { data: authUser, error: authUserError } = await supabaseAdmin.auth.admin.getUserById(
    legacy.id,
  );
  if (authUserError) throw authUserError;
  if (authUser.user?.email?.toLowerCase() !== profile.email.toLowerCase()) return null;

  const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(legacy.id, {
    email: authEmail,
    email_confirm: true,
  });
  if (updateError) throw updateError;

  return legacy.id as string;
}

export async function createSocialSession(supabaseAdmin: SupabaseClient, profile: SocialProfile) {
  const authEmail = toAuthEmail(profile.provider, profile.providerUserId);
  const password = crypto.randomUUID();
  const userMetadata = {
    provider: profile.provider,
    nickname: profile.nickname,
    profile_image: profile.profileImage,
  };

  let userId =
    (await findAuthUserIdByEmail(supabaseAdmin, authEmail)) ??
    (await migrateLegacyUser(supabaseAdmin, profile, authEmail));

  if (userId) {
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
      password,
      user_metadata: userMetadata,
    });
    if (updateError) throw updateError;
  } else {
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: authEmail,
      password,
      email_confirm: true,
      user_metadata: userMetadata,
    });
    if (authError) throw authError;
    userId = authData.user?.id ?? null;
  }

  if (!userId) throw new Error('User creation failed');

  const { error: upsertError } = await supabaseAdmin.from('users').upsert({
    id: userId,
    provider: profile.provider,
    email: profile.email,
    nickname: profile.nickname,
    profile_image: profile.profileImage,
  });
  if (upsertError) throw upsertError;

  const { data: signInData, error: signInError } = await supabaseAdmin.auth.signInWithPassword({
    email: authEmail,
    password,
  });
  if (signInError) throw signInError;

  // 사용자당 세션 하나만 유지: 방금 발급한 세션을 제외한 다른 기기 세션을 모두 종료한다
  const newAccessToken = signInData.session?.access_token;
  if (newAccessToken) {
    const { error: signOutError } = await supabaseAdmin.auth.admin.signOut(
      newAccessToken,
      'others',
    );
    // 종료에 실패해도 로그인 자체는 진행한다
    if (signOutError) console.error('[auth] 다른 세션 종료 실패', signOutError.message);
  }

  return {
    userId,
    accessToken: signInData.session?.access_token,
    refreshToken: signInData.session?.refresh_token,
    provider: profile.provider,
  };
}

const DEV_NICKNAME: Record<SocialProvider, string> = {
  kakao: '카카오 사용자',
  naver: '네이버 사용자',
};

interface SocialAuthBody {
  accessToken?: string;
  code?: string;
  redirectUri?: string;
  state?: string;
  intent?: string;
  forceAccountPicker?: boolean;
  /** 앱이 브라우저로 로그인을 시작할 때 true (appLogin.ts) */
  appLogin?: boolean;
  sealed?: string;
  appProof?: string;
}

/**
 * 소셜 로그인 함수 공통 처리.
 * 웹은 인가 코드 교환, 앱은 브라우저 로그인(sealed 코드) 또는 SDK accessToken(구버전 앱)을 보낸다.
 * DEV_AUTH 환경에서는 토큰 확인 없이 개발용 프로필을 쓴다.
 */
export function serveSocialAuth(
  provider: SocialProvider,
  fetchProfile: (accessToken: string) => Promise<SocialProfile>,
  oauth: SocialOAuth,
) {
  serveJson(async (req) => {
    const body = (await req.json()) as SocialAuthBody;

    if (body.intent === 'authorize') {
      if (!body.redirectUri) throw new Error('로그인에 실패했습니다.');
      const appLogin = body.appLogin === true ? await createAppLoginState(provider) : null;
      const state = appLogin?.state ?? body.state;
      if (!state) throw new Error('로그인에 실패했습니다.');
      return {
        authorizeUrl: oauth.buildAuthorizeUrl({
          redirectUri: body.redirectUri,
          state,
          forceAccountPicker: body.forceAccountPicker === true,
        }),
        ...(appLogin ?? {}),
      };
    }

    // 웹 /callback이 앱 로그인의 인가 코드를 암호화해 앱으로 넘긴다
    if (body.intent === 'seal') {
      if (!body.code || !isAppLoginState(body.state)) throw new Error('로그인에 실패했습니다.');
      return sealAppLoginCode(provider, body.state, body.code);
    }

    const devAuth = Deno.env.get('DEV_AUTH') === 'true';
    let accessToken = body.accessToken;
    if (!accessToken && body.sealed) {
      if (!body.redirectUri || !isAppLoginState(body.state)) {
        throw new Error('로그인에 실패했습니다.');
      }
      const code = await openAppLoginCode(provider, {
        state: body.state,
        sealed: body.sealed,
        appProof: body.appProof,
      });
      accessToken = await oauth.exchangeCode({
        code,
        redirectUri: body.redirectUri,
        state: body.state,
      });
    } else if (!accessToken && body.code) {
      // 앱 로그인의 코드는 반드시 sealed로만 받는다
      if (!body.redirectUri || !body.state || isAppLoginState(body.state)) {
        throw new Error('로그인에 실패했습니다.');
      }
      accessToken = await oauth.exchangeCode({
        code: body.code,
        redirectUri: body.redirectUri,
        state: body.state,
      });
    }
    if (!devAuth && !accessToken) throw new Error('로그인에 실패했습니다.');

    const profile: SocialProfile = devAuth
      ? {
          provider,
          providerUserId: 'dev',
          email: null,
          nickname: DEV_NICKNAME[provider],
          profileImage: null,
        }
      : await fetchProfile(accessToken!);

    return createSocialSession(createAdminClient(), profile);
  });
}
