import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

import {
  corsHeaders,
  createSocialSession,
  jsonResponse,
  type SocialProfile,
} from '../_shared/socialAuth.ts';

async function fetchNaverProfile(accessToken: string): Promise<SocialProfile> {
  const profileRes = await fetch('https://openapi.naver.com/v1/nid/me', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!profileRes.ok) throw new Error('Invalid Naver token');

  const profile = await profileRes.json();
  const naverUser = profile.response;
  if (!naverUser?.id) throw new Error('Invalid Naver token');

  return {
    provider: 'naver',
    providerUserId: String(naverUser.id),
    email: naverUser.email ?? null,
    nickname: naverUser.nickname ?? naverUser.name ?? '네이버 사용자',
    profileImage: naverUser.profile_image ?? null,
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
          provider: 'naver',
          providerUserId: 'dev',
          email: null,
          nickname: '네이버 사용자',
          profileImage: null,
        }
      : await fetchNaverProfile(accessToken);

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
