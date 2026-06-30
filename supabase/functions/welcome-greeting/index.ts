import { generateGeminiContent } from "../_shared/gemini.ts";

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
    const { dogName, personality, speechStyle } = await req.json();

    const greeting = await generateGeminiContent({
      systemInstruction:
        "강아지 1인칭으로 짧은 환영 인사말을 작성합니다. 2문장 이내.",
      userPrompt: `이름: ${dogName}, 성격: ${JSON.stringify(personality)}, 말투: ${speechStyle ?? "기본"}`,
    });

    return new Response(JSON.stringify({ greeting }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
