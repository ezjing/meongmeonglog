import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  GEMINI_MODEL,
  generateGeminiContent,
} from "../_shared/gemini.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
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
    const event = walk.walk_events?.[0] ?? walk.walk_events;
    const photos = walk.walk_photos ?? [];

    const prompt = `
강아지 ${dog.name}(${dog.breed})의 1인칭 시점으로 산책 일기를 작성해주세요.
성격: ${JSON.stringify(dog.personality)}
말투: ${dog.speech_style ?? "기본"}
산책 시간: ${walk.duration_sec ?? 0}초, 거리: ${walk.distance_meter ?? 0}m
날씨: ${walk.weather_condition ?? "맑음"} ${walk.weather_temp ?? ""}°C
특이사항: 배변 소변 ${event?.pee_count ?? 0}, 대변 ${event?.poop_count ?? 0}, 친구 만남 ${event?.dog_meeting_level ?? "NONE"}, 메모: ${event?.memo ?? ""}

JSON 형식으로 응답: {"content":"일기 본문","dailyQuote":"오늘의 한마디 한 줄"}
`.trim();

    const content = await generateGeminiContent({
      systemInstruction:
        "당신은 반려견 시점의 감성 일기 작가입니다. 따뜻하고 자연스러운 한국어로 작성합니다.",
      userPrompt: prompt,
      jsonResponse: true,
      imageUrl: photos.length > 0 ? photos[0].image_url : undefined,
      imagePrompt: "산책 사진을 참고해 상황을 묘사해주세요.",
    });

    const parsed = JSON.parse(content);

    const { data: diary, error: diaryError } = await supabase
      .from("diaries")
      .insert({
        walk_id: walkId,
        dog_id: dog.id,
        diary_content: parsed.content ?? "오늘 산책 정말 즐거웠어!",
        daily_quote: parsed.dailyQuote ?? "산책은 최고야!",
        ai_model: GEMINI_MODEL,
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
