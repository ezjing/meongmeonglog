import { createAdminClient, getRequestUserId } from '../_shared/requestUser.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { diaryId } = await req.json();
    const supabase = createAdminClient();
    const userId = await getRequestUserId(req, supabase);

    const { data: diary, error } = await supabase
      .from('diaries')
      .select('*, dogs(name, user_id), walk_photos:walks(walk_photos(image_url))')
      .eq('id', diaryId)
      .single();

    if (error || !diary || diary.dogs?.user_id !== userId) throw new Error('Diary not found');

    const placeholderUrl = `https://placeholder.meongmeonglog/share/${diaryId}.png`;

    await supabase.from('share_cards').insert({
      diary_id: diaryId,
      image_url: placeholderUrl,
    });

    return new Response(JSON.stringify({ imageUrl: placeholderUrl }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
