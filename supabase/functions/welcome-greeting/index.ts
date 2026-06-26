import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import OpenAI from 'https://esm.sh/openai@4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { dogName, personality, speechStyle } = await req.json();

    const openai = new OpenAI({ apiKey: Deno.env.get('OPENAI_API_KEY')! });

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: '강아지 1인칭으로 짧은 환영 인사말을 작성합니다. 2문장 이내.',
        },
        {
          role: 'user',
          content: `이름: ${dogName}, 성격: ${JSON.stringify(personality)}, 말투: ${speechStyle ?? '기본'}`,
        },
      ],
    });

    const greeting =
      completion.choices[0].message.content ??
      `안녕! 나는 ${dogName}야~ 오늘부터 매일매일 산책일기 같이 써보자, 멍멍!`;

    return new Response(JSON.stringify({ greeting }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
