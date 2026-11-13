/// <reference path="../_shared/deno.d.ts" />

import { generateGroqContent } from "../_shared/groq.ts";
import { serveJson } from "../_shared/http.ts";
import { createAdminClient, getRequestUserId } from "../_shared/requestUser.ts";
import {
  buildDiaryImagePrompt,
  buildDiarySystemInstruction,
  buildDiaryUserPrompt,
} from "../_shared/speechStyle.ts";

serveJson(async (req) => {
  const { walkId } = await req.json();
  const supabase = createAdminClient();
  const userId = await getRequestUserId(req, supabase);

  // 산책·기존 일기·보호자 정보는 서로 의존하지 않으므로 함께 조회한다 (보호자 = 요청한 사용자)
  const [walkResult, existingDiaryResult, guardianResult] = await Promise.all([
    supabase
      .from("walks")
      .select(
        "duration_sec, distance_meter, weather_condition, weather_temp, " +
          "dogs(id, user_id, name, breed, personality, custom_personality, speech_style, custom_speech_style), " +
          "walk_events(pee_count, poop_count, dog_meeting_level, memo), " +
          "walk_photos(image_url, sort_order)",
      )
      .eq("id", walkId)
      .single(),
    supabase
      .from("diaries")
      .select("id, diary_content, daily_quote, ai_model")
      .eq("walk_id", walkId)
      .maybeSingle(),
    supabase
      .from("users")
      .select("guardian_title, parenting_style, current_concern")
      .eq("id", userId)
      .maybeSingle(),
  ]);

  const { data: walk, error: walkError } = walkResult;
  if (walkError || !walk) throw new Error("Walk not found");

  const dog = walk.dogs;
  if (dog?.user_id !== userId) throw new Error("Walk not found");

  // 재시도 등으로 이미 생성된 일기가 있으면 새로 만들지 않고 그대로 반환
  const existingDiary = existingDiaryResult.data;

  if (existingDiary) {
    return {
      diaryId: existingDiary.id,
      content: existingDiary.diary_content,
      dailyQuote: existingDiary.daily_quote,
      aiModel: existingDiary.ai_model,
    };
  }

  const guardian = guardianResult.data;
  const event = walk.walk_events?.[0] ?? walk.walk_events;
  // 대표 사진은 첫 번째(sort_order가 가장 작은) 사진
  const photos = [...(walk.walk_photos ?? [])].sort(
    (a: { sort_order: number }, b: { sort_order: number }) => a.sort_order - b.sort_order,
  );

  const guardianTitle = guardian?.guardian_title?.trim() || "보호자";

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
      guardianTitle,
      parentingStyle: guardian?.parenting_style,
      currentConcern: guardian?.current_concern,
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
    .from("diaries")
    .insert({
      walk_id: walkId,
      dog_id: dog.id,
      diary_content: parsed.content ?? "오늘 산책 정말 즐거웠어!",
      daily_quote: parsed.dailyQuote ?? "산책은 최고야!",
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
