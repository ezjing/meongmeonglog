import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

import {
  corsHeaders,
  createSocialSession,
  jsonResponse,
  type SocialProfile,
} from '../_shared/socialAuth.ts';

/** 카카오디벨로퍼스 멍멍로그 앱 ID — 다른 앱에서 발급된 토큰 차단용 */
const KAKAO_APP_ID = 1496855;

async function fetchKakaoProfile(accessToken: string): Promise<SocialProfile> {
  const headers = { Authorization: `Bearer ${accessToken}` };

  const tokenInfoRes = await fetch('https://kapi.kakao.com/v1/user/access_token_info', {
    headers,
  });
  if (!tokenInfoRes.ok) throw new Error('Invalid Kakao token');
  const tokenInfo = await tokenInfoRes.json();
  if (tokenInfo.app_id !== KAKAO_APP_ID) throw new Error('Invalid Kakao token');

  const userRes = await fetch('https://kapi.kakao.com/v2/user/me', { headers });
  if (!userRes.ok) throw new Error('Invalid Kakao token');
  const kakaoUser = await userRes.json();
  if (!kakaoUser.id || kakaoUser.id !== tokenInfo.id) throw new Error('Invalid Kakao token');

  const account = kakaoUser.kakao_account;
  const isEmailVerified = account?.is_email_valid === true && account?.is_email_verified === true;

  return {
    provider: 'kakao',
    providerUserId: String(kakaoUser.id),
    email: isEmailVerified ? (account?.email ?? null) : null,
    nickname: account?.profile?.nickname ?? kakaoUser.properties?.nickname ?? '카카오 사용자',
    profileImage: account?.profile?.profile_image_url ?? null,
  };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { accessToken } = await req.json();
    const devAuth = Deno.env.get('DEV_AUTH') === 'true';

    const profile: SocialProfile = devAuth
      ? {
          provider: 'kakao',
          providerUserId: 'dev',
          email: null,
          nickname: '카카오 사용자',
          profileImage: null,
        }
      : await fetchKakaoProfile(accessToken);

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const session = await createSocialSession(supabaseAdmin, profile);
    return jsonResponse(session);
  } catch (error) {
    return jsonResponse({ error: (error as Error).message }, 400);
  }
});
