import { createClient, type SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const STORAGE_BUCKETS = ['dog-profiles', 'walk-photos', 'share-cards'] as const;

const LIST_PAGE_SIZE = 1000;

/** prefix 아래 모든 파일 경로를 하위 폴더(예: {userId}/{walkId}/0.jpg)까지 재귀로 수집 */
async function listAllFilePaths(
  supabaseAdmin: SupabaseClient,
  bucket: string,
  prefix: string,
): Promise<string[]> {
  const paths: string[] = [];
  let offset = 0;

  while (true) {
    const { data: entries, error } = await supabaseAdmin.storage
      .from(bucket)
      .list(prefix, { limit: LIST_PAGE_SIZE, offset });
    if (error) throw error;
    if (!entries?.length) break;

    for (const entry of entries) {
      const path = `${prefix}/${entry.name}`;
      // 폴더 항목은 id가 없다
      if (entry.id == null) {
        paths.push(...(await listAllFilePaths(supabaseAdmin, bucket, path)));
      } else {
        paths.push(path);
      }
    }

    if (entries.length < LIST_PAGE_SIZE) break;
    offset += LIST_PAGE_SIZE;
  }

  return paths;
}

async function deleteUserFiles(
  supabaseAdmin: SupabaseClient,
  userId: string,
) {
  for (const bucket of STORAGE_BUCKETS) {
    const paths = await listAllFilePaths(supabaseAdmin, bucket, userId);

    for (let i = 0; i < paths.length; i += LIST_PAGE_SIZE) {
      const { error } = await supabaseAdmin.storage
        .from(bucket)
        .remove(paths.slice(i, i + LIST_PAGE_SIZE));
      if (error) throw error;
    }
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
    // 파일 삭제가 실패하면 계정을 지우기 전에 중단한다 (재시도 가능하도록).
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
