import { serveJson } from '../_shared/http.ts';
import { createAdminClient, getRequestUserId } from '../_shared/requestUser.ts';

serveJson(async (req) => {
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

  return { imageUrl: placeholderUrl };
});
