import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const STORAGE_BUCKETS = ['dog-profiles', 'walk-photos', 'share-cards'] as const;

async function deleteUserFiles(
  supabaseAdmin: ReturnType<typeof createClient>,
  userId: string,
) {
  for (const bucket of STORAGE_BUCKETS) {
    const { data: files } = await supabaseAdmin.storage.from(bucket).list(userId);
    if (!files?.length) continue;

    const paths = files.map((file) => `${userId}/${file.name}`);
    await supabaseAdmin.storage.from(bucket).remove(paths);
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const token = req.headers.get('Authorization')?.replace('Bearer ', '');
    if (!token) throw new Error('로그인이 필요합니다.');

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(token);
    if (userError || !userData.user) throw new Error('세션이 유효하지 않습니다.');

    const userId = userData.user.id;

    // dogs/walks/diaries/... all cascade-delete from `public.users`,
    // which itself cascades from `auth.users` (see 001_initial.sql).
    await deleteUserFiles(supabaseAdmin, userId);

    const { error: deleteAuthError } = await supabaseAdmin.auth.admin.deleteUser(userId);
    if (deleteAuthError) throw deleteAuthError;

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
