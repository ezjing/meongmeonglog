/// <reference path="../_shared/deno.d.ts" />

import { generateGroqContent } from "../_shared/groq.ts";
import { createAdminClient, getRequestUserId } from "../_shared/requestUser.ts";
import {
  buildGreetingSystemInstruction,
  buildGreetingUserPrompt,
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
    // 로그인한 사용자만 AI 호출 허용 (anon key로 Groq 크레딧 소진 방지)
    await getRequestUserId(req, createAdminClient());

    const { dogName, personality, speechStyle, customSpeechStyle } = await req
      .json();

    const { text: greeting } = await generateGroqContent({
      systemInstruction: buildGreetingSystemInstruction({
        speechStyle,
        customSpeechStyle,
      }),
      userPrompt: buildGreetingUserPrompt({
        dogName,
        personality,
        speechStyle,
        customSpeechStyle,
      }),
      temperature: 0.7,
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
