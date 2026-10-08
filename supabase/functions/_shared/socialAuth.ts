import type { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';

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

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/** 소셜 고유 ID 기반 Supabase Auth 이메일 (provider 간 계정이 합쳐지지 않도록) */
function toAuthEmail(provider: SocialProvider, providerUserId: string) {
  return `${provider}-${providerUserId}@meongmeonglog.dev`.toLowerCase();
}

async function findAuthUserIdByEmail(supabaseAdmin: SupabaseClient, email: string) {
  const target = email.toLowerCase();
  let page = 1;

  while (true) {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) throw error;

    const existing = data.users.find((user) => user.email?.toLowerCase() === target);
    if (existing?.id) return existing.id as string;

    if (data.users.length < 1000) break;
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

  return {
    userId,
    accessToken: signInData.session?.access_token,
    refreshToken: signInData.session?.refresh_token,
    provider: profile.provider,
  };
}

export function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
