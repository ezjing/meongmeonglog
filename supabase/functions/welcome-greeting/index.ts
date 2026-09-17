/// <reference path="../_shared/deno.d.ts" />

import { generateGroqContent } from "../_shared/groq.ts";
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
