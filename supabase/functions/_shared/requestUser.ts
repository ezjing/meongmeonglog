/// <reference path="./deno.d.ts" />

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

export function createAdminClient() {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );
}

/** Authorization 헤더의 사용자 JWT를 검증해 사용자 ID를 반환 (anon key는 거부) */
export async function getRequestUserId(
  req: Request,
  supabaseAdmin: ReturnType<typeof createAdminClient>,
): Promise<string> {
  const token = req.headers.get("Authorization")?.replace("Bearer ", "");
  if (!token) throw new Error("로그인이 필요합니다.");

  const { data, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !data.user) throw new Error("세션이 유효하지 않습니다.");

  return data.user.id;
}
