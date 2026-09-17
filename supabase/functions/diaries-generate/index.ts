/// <reference path="../_shared/deno.d.ts" />

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { generateGroqContent } from "../_shared/groq.ts";
import {
  buildDiaryImagePrompt,
  buildDiarySystemInstruction,
  buildDiaryUserPrompt,
} from "../_shared/speechStyle.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { walkId } = await req.json();
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: walk, error: walkError } = await supabase
      .from("walks")
      .select("*, dogs(*), walk_events(*), walk_photos(*)")
      .eq("id", walkId)
      .single();

    if (walkError || !walk) throw new Error("Walk not found");

    const dog = walk.dogs;

    const { data: guardian } = await supabase
      .from("users")
      .select("guardian_title, parenting_style, current_concern")
      .eq("id", dog.user_id)
      .maybeSingle();

    const event = walk.walk_events?.[0] ?? walk.walk_events;
    const photos = walk.walk_photos ?? [];

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

    return new Response(
      JSON.stringify({
        diaryId: diary.id,
        content: diary.diary_content,
        dailyQuote: diary.daily_quote,
        aiModel: model,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
