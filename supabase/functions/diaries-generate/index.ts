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

const PHOTO_DESCRIPTION_MAX_TOKENS = 300;

const PHOTO_DESCRIPTION_PROMPT = [
  '산책 사진을 일기 작성용으로 객관적으로 묘사한다: 장소, 날씨·빛, 계절감, 강아지 수·모습·행동. 사람 얼굴·차량 번호·간판 글자 등 개인을 알아볼 수 있는 정보는 쓰지 않는다. 사진에 없는 내용은 지어내지 않는다.',
  '2~4문장으로 쓴다.',
].join('\n');

function storedPhotoDescription(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

/** 여러 마리 산책의 장면 설명. 이미 있으면 재사용하고, 요청이 실패하면 사진 없이 일기를 계속한다. */
async function ensurePhotoDescription(
  supabase: ReturnType<typeof createAdminClient>,
  walkId: string,
  existing: unknown,
  imageUrl: string,
): Promise<string | undefined> {
  const saved = storedPhotoDescription(existing);
  if (saved) return saved;

  let generated: string;
  try {
    const { text } = await generateGroqContent({
      userPrompt: PHOTO_DESCRIPTION_PROMPT,
      imageUrl,
      maxTokens: PHOTO_DESCRIPTION_MAX_TOKENS,
    });
    generated = text.trim();
  } catch {
    return undefined;
  }
  if (!generated) return undefined;

  await supabase
    .from('walks')
    .update({ photo_description: generated })
    .eq('id', walkId)
    .is('photo_description', null);

  const { data } = await supabase
    .from('walks')
    .select('photo_description')
    .eq('id', walkId)
    .maybeSingle();

  return storedPhotoDescription(data?.photo_description) ?? generated;
}

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
      'dog_id, recorded_by, duration_sec, distance_meter, weather_condition, weather_temp, photo_description, walk_photos(image_url, sort_order)',
    )
    .eq('id', walkId)
    .single();

  if (walkError || !walk) throw new Error('Walk not found');

  const dogId = requestedDogId ?? walk.dog_id;

  const [walkDogsResult, dogResult, existingDiaryResult, eventResult, companionResult] =
    await Promise.all([
      supabase.from('walk_dogs').select('dog_id').eq('walk_id', walkId),
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
  const walkDogIds = ((walkDogsResult.data ?? []) as { dog_id: string }[]).map((row) => row.dog_id);
  // 그 산책에 포함된 강아지이고, 요청자가 그 집의 구성원인지 확인한다
  if (!dog || !memberResult.data || !walkDogIds.includes(dogId)) throw new Error('Walk not found');

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

  const firstPhotoUrl = photos.length > 0 ? photos[0].image_url : undefined;
  const multiDog = walkDogIds.length >= 2;
  let imageUrl: string | undefined;
  let photoDescription: string | undefined;
  if (multiDog) {
    if (firstPhotoUrl) {
      photoDescription = await ensurePhotoDescription(
        supabase,
        walkId,
        walk.photo_description,
        firstPhotoUrl,
      );
    }
  } else {
    imageUrl = firstPhotoUrl;
  }

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
      photoDescription,
    }),
    jsonResponse: true,
    imageUrl,
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
