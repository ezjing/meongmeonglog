/// <reference path="./deno.d.ts" />

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/** 외부 API(Groq·카카오·네이버·사진) 호출 제한 시간 */
const EXTERNAL_API_TIMEOUT_MS = 30_000;
const TIMEOUT_MESSAGE = '응답이 늦어 요청을 중단했어요. 잠시 후 다시 시도해주세요.';

/** fetch의 signal에 넣는다: fetch(url, { signal: externalApiSignal() }) */
export function externalApiSignal(): AbortSignal {
  return AbortSignal.timeout(EXTERNAL_API_TIMEOUT_MS);
}

function toErrorMessage(error: unknown): string {
  if (error instanceof DOMException && error.name === 'TimeoutError') return TIMEOUT_MESSAGE;
  return (error as Error).message;
}

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
      return jsonResponse({ error: toErrorMessage(error) }, 400);
    }
  });
}
