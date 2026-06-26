import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

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
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const { data: diary, error } = await supabase
      .from('diaries')
      .select('*, dogs(name), walk_photos:walks(walk_photos(image_url))')
      .eq('id', diaryId)
      .single();

    if (error || !diary) throw new Error('Diary not found');

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
