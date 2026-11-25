/// <reference path="../_shared/deno.d.ts" />

import { guardianTitleOrDefault } from '../_shared/guardianTitle.ts';
import { generateGroqContent } from '../_shared/groq.ts';
import { serveJson } from '../_shared/http.ts';
import { createAdminClient, getRequestUserId } from '../_shared/requestUser.ts';
import {
  buildDiaryImagePrompt,
  buildDiarySystemInstruction,
  buildDiaryUserPrompt,
} from '../_shared/speechStyle.ts';

serveJson(async (req) => {
  const body = await req.json();
  const walkId = body.walkId as string | undefined;
  // dogId가 없으면 대표 강아지(walks.dog_id). 옛 앱은 walkId만 보낸다.
  const requestedDogId =
    typeof body.dogId === 'string' && body.dogId.length > 0 ? (body.dogId as string) : undefined;
  if (!walkId) throw new Error('Walk not found');

  const supabase = createAdminClient();
  const userId = await getRequestUserId(req, supabase);

  const { data: walk, error: walkError } = await supabase
    .from('walks')
    .select(
      'dog_id, recorded_by, duration_sec, distance_meter, weather_condition, weather_temp, walk_photos(image_url, sort_order)',
    )
    .eq('id', walkId)
    .single();

  if (walkError || !walk) throw new Error('Walk not found');

  const dogId = requestedDogId ?? walk.dog_id;

  const [linkResult, dogResult, existingDiaryResult, eventResult, companionResult] =
    await Promise.all([
      supabase
        .from('walk_dogs')
        .select('dog_id')
        .eq('walk_id', walkId)
        .eq('dog_id', dogId)
        .maybeSingle(),
      supabase
        .from('dogs')
        .select(
          'id, user_id, household_id, name, breed, personality, custom_personality, speech_style, custom_speech_style',
        )
        .eq('id', dogId)
        .maybeSingle(),
      supabase
        .from('diaries')
        .select('id, diary_content, daily_quote, ai_model')
        .eq('walk_id', walkId)
        .eq('dog_id', dogId)
        .maybeSingle(),
      supabase
        .from('walk_events')
        .select('pee_count, poop_count, dog_meeting_level, memo')
        .eq('walk_id', walkId)
        .eq('dog_id', dogId)
        .maybeSingle(),
      supabase.from('walk_companions').select('user_id').eq('walk_id', walkId).order('user_id'),
    ]);

  const dog = dogResult.data;
  const memberResult = dog?.household_id
    ? await supabase
        .from('household_members')
        .select('user_id')
        .eq('household_id', dog.household_id)
        .eq('user_id', userId)
        .maybeSingle()
    : { data: null };
  // 그 산책에 포함된 강아지이고, 요청자가 그 집의 구성원인지 확인한다
  if (!dog || !memberResult.data || !linkResult.data) throw new Error('Walk not found');

  const existingDiary = existingDiaryResult.data;
  if (existingDiary) {
    return {
      diaryId: existingDiary.id,
      content: existingDiary.diary_content,
      dailyQuote: existingDiary.daily_quote,
      aiModel: existingDiary.ai_model,
    };
  }

  if (companionResult.error) throw companionResult.error;

  const event = eventResult.data;
  const photos = [...(walk.walk_photos ?? [])].sort(
    (a: { sort_order: number }, b: { sort_order: number }) => a.sort_order - b.sort_order,
  );
  const recorderId = (walk.recorded_by as string | null) ?? null;
  const companionIds = (companionResult.data ?? []).map((row: { user_id: string }) => row.user_id);
  const profileIds = [
    ...new Set([recorderId, userId, ...companionIds].filter((id): id is string => !!id)),
  ];
  const { data: profiles, error: profileError } = await supabase
    .from('users')
    .select('id, guardian_title, parenting_style, current_concern')
    .in('id', profileIds);
  if (profileError) throw profileError;

  const profileRows = (profiles ?? []) as {
    id: string;
    guardian_title: string | null;
    parenting_style: string | null;
    current_concern: string | null;
  }[];
  const profileOf = (id: string | null) => profileRows.find((row) => row.id === id);
  const titleOf = (id: string | null): string | null => {
    const row = profileOf(id);
    if (!row) return null;
    return guardianTitleOrDefault(row.guardian_title);
  };
  // 호칭은 기록한 사람 다음 같이 간 가족. 기록한 사람이 탈퇴했으면 그 호칭은 빠지고, 양육 정보는 요청자 것을 쓴다.
  const guardianTitles = [
    ...(recorderId ? [titleOf(recorderId)] : []),
    ...companionIds.map((id) => titleOf(id)),
  ].filter((title): title is string => !!title);
  if (guardianTitles.length === 0) {
    guardianTitles.push(guardianTitleOrDefault(profileOf(userId)?.guardian_title));
  }
  const styleSource = profileOf(recorderId ?? userId);

  const { text: content, model } = await generateGroqContent({
    systemInstruction: buildDiarySystemInstruction({
      dogName: dog.name,
      speechStyle: dog.speech_style,
      customSpeechStyle: dog.custom_speech_style,
    }),
    userPrompt: buildDiaryUserPrompt({
      dogName: dog.name,
      breed: dog.breed,
      personality: dog.personality,
      customPersonality: dog.custom_personality,
      speechStyle: dog.speech_style,
      customSpeechStyle: dog.custom_speech_style,
      guardianTitles,
      parentingStyle: styleSource?.parenting_style,
      currentConcern: styleSource?.current_concern,
      durationSec: walk.duration_sec,
      distanceMeter: walk.distance_meter,
      weatherCondition: walk.weather_condition,
      weatherTemp: walk.weather_temp,
      peeCount: event?.pee_count,
      poopCount: event?.poop_count,
      dogMeetingLevel: event?.dog_meeting_level,
      memo: event?.memo,
    }),
    jsonResponse: true,
    imageUrl: photos.length > 0 ? photos[0].image_url : undefined,
    imagePrompt: buildDiaryImagePrompt(),
    temperature: 0.7,
  });

  const parsed = JSON.parse(content);

  const { data: diary, error: diaryError } = await supabase
    .from('diaries')
    .insert({
      walk_id: walkId,
      dog_id: dog.id,
      diary_content: parsed.content ?? '오늘 산책 정말 즐거웠어!',
      daily_quote: parsed.dailyQuote ?? '산책은 최고야!',
      ai_model: model,
      generated_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (diaryError) throw diaryError;

  return {
    diaryId: diary.id,
    content: diary.diary_content,
    dailyQuote: diary.daily_quote,
    aiModel: model,
  };
});
