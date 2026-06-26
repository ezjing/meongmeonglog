import { createClient, type SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function findUserIdByEmail(supabaseAdmin: SupabaseClient, email: string) {
  let page = 1;

  while (true) {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) throw error;

    const existing = data.users.find((user) => user.email === email);
    if (existing?.id) return existing.id;

    if (data.users.length < 1000) break;
    page += 1;
  }

  return null;
}

async function createAuthSession(
  supabaseAdmin: SupabaseClient,
  email: string,
  provider: 'kakao',
  nickname: string,
  profileImage: string | null,
) {
  const password = crypto.randomUUID();
  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { provider, nickname, profile_image: profileImage },
  });

  let userId = authData.user?.id;

  if (authError) {
    const isDuplicate =
      authError.message.includes('already been registered') ||
      authError.message.includes('already exists');

    if (!isDuplicate) throw authError;

    userId = await findUserIdByEmail(supabaseAdmin, email);
    if (!userId) throw new Error('User lookup failed');

    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
      password,
      user_metadata: { provider, nickname, profile_image: profileImage },
    });
    if (updateError) throw updateError;
  }

  if (!userId) throw new Error('User creation failed');

  await supabaseAdmin.from('users').upsert({
    id: userId,
    provider,
    email,
    nickname,
    profile_image: profileImage,
  });

  const { data: signInData, error: signInError } = await supabaseAdmin.auth.signInWithPassword({
    email,
    password,
  });

  if (signInError) throw signInError;

  return {
    userId,
    accessToken: signInData.session?.access_token,
    refreshToken: signInData.session?.refresh_token,
    provider,
  };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { provider, accessToken } = await req.json();
    const devAuth = Deno.env.get('DEV_AUTH') === 'true';

    let email = `${provider}-user@meongmeonglog.dev`;
    let nickname = `${provider} 사용자`;
    let profileImage: string | null = null;

    if (!devAuth && accessToken !== 'dev') {
      if (provider === 'kakao') {
        const kakaoRes = await fetch('https://kapi.kakao.com/v2/user/me', {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        if (!kakaoRes.ok) throw new Error('Invalid Kakao token');
        const kakaoUser = await kakaoRes.json();
        const kakaoId = kakaoUser.id;
        email = kakaoUser.kakao_account?.email ?? `kakao-${kakaoId}@meongmeonglog.dev`;
        nickname =
          kakaoUser.kakao_account?.profile?.nickname ??
          kakaoUser.properties?.nickname ??
          nickname;
        profileImage = kakaoUser.kakao_account?.profile?.profile_image_url ?? null;
      }
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const session = await createAuthSession(
      supabaseAdmin,
      email,
      'kakao',
      nickname,
      profileImage,
    );

    return new Response(JSON.stringify(session), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
