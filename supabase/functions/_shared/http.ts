/// <reference path="./deno.d.ts" />

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

export function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

/**
 * JSON API 함수 공통 처리: CORS preflight 응답, 반환값을 JSON으로,
 * 던진 에러는 `{ error }`(400)로 응답한다.
 */
export function serveJson(handler: (req: Request) => Promise<unknown>) {
  Deno.serve(async (req: Request) => {
    if (req.method === 'OPTIONS') {
      return new Response('ok', { headers: corsHeaders });
    }

    try {
      return jsonResponse(await handler(req));
    } catch (error) {
      return jsonResponse({ error: (error as Error).message }, 400);
    }
  });
}
