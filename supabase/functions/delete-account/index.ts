/// <reference path="../_shared/deno.d.ts" />

import type { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';

import { externalApiSignal, serveJson } from '../_shared/http.ts';
import { createAdminClient, getRequestUserId } from '../_shared/requestUser.ts';
import { kakaoUserIdFromAuthEmail } from '../_shared/socialAuth.ts';

const KAKAO_UNLINK_URL = 'https://kapi.kakao.com/v1/user/unlink';

// share-cards: 예전 공유 카드 기능이 남긴 파일 정리용 (기능은 삭제됨)
const STORAGE_BUCKETS = ['dog-profiles', 'walk-photos', 'share-cards'] as const;

const LIST_PAGE_SIZE = 1000;

/** prefix 아래 모든 파일 경로를 하위 폴더(예: {userId}/{walkId}/0.jpg)까지 재귀로 수집 */
async function listAllFilePaths(
  supabaseAdmin: SupabaseClient,
  bucket: string,
  prefix: string,
): Promise<string[]> {
  const paths: string[] = [];
  let offset = 0;

  while (true) {
    const { data: entries, error } = await supabaseAdmin.storage
      .from(bucket)
      .list(prefix, { limit: LIST_PAGE_SIZE, offset });
    if (error) throw error;
    if (!entries?.length) break;

    for (const entry of entries) {
      const path = `${prefix}/${entry.name}`;
      // 폴더 항목은 id가 없다
      if (entry.id == null) {
        paths.push(...(await listAllFilePaths(supabaseAdmin, bucket, path)));
      } else {
        paths.push(path);
      }
    }

    if (entries.length < LIST_PAGE_SIZE) break;
    offset += LIST_PAGE_SIZE;
  }

  return paths;
}

function unlinkErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'unknown';
}

/** 카카오 계정이면 연결을 끊는다. 실패하거나 키가 없어도 탈퇴는 계속한다. 네이버는 호출하지 않는다. */
async function unlinkKakaoIfNeeded(supabaseAdmin: SupabaseClient, userId: string) {
  const adminKey = Deno.env.get('KAKAO_ADMIN_KEY');
  if (!adminKey) return;

  try {
    const { data, error } = await supabaseAdmin.auth.admin.getUserById(userId);
    if (error) {
      console.error('[delete-account] 카카오 연결 끊기 실패', error.message);
      return;
    }

    const kakaoUserId = kakaoUserIdFromAuthEmail(data.user?.email);
    if (!kakaoUserId) return;

    const response = await fetch(KAKAO_UNLINK_URL, {
      method: 'POST',
      headers: {
        Authorization: `KakaoAK ${adminKey}`,
        'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8',
      },
      body: new URLSearchParams({
        target_id_type: 'user_id',
        target_id: kakaoUserId,
      }),
      signal: externalApiSignal(),
    });
    if (!response.ok) {
      console.error('[delete-account] 카카오 연결 끊기 실패', response.status);
    }
  } catch (error) {
    console.error('[delete-account] 카카오 연결 끊기 실패', unlinkErrorMessage(error));
  }
}

async function deleteUserFiles(
  supabaseAdmin: SupabaseClient,
  userId: string,
) {
  // 버킷끼리는 독립적이라 함께 지운다
  await Promise.all(
    STORAGE_BUCKETS.map(async (bucket) => {
      const paths = await listAllFilePaths(supabaseAdmin, bucket, userId);

      for (let i = 0; i < paths.length; i += LIST_PAGE_SIZE) {
        const { error } = await supabaseAdmin.storage
          .from(bucket)
          .remove(paths.slice(i, i + LIST_PAGE_SIZE));
        if (error) throw error;
      }
    }),
  );
}

serveJson(async (req) => {
  const supabaseAdmin = createAdminClient();
  const userId = await getRequestUserId(req, supabaseAdmin);

  // dogs/walks/diaries/... all cascade-delete from `public.users`,
  // which itself cascades from `auth.users` (see 001_initial.sql).
  // 파일 삭제가 실패하면 계정을 지우기 전에 중단한다 (재시도 가능하도록).
  await deleteUserFiles(supabaseAdmin, userId);
  await unlinkKakaoIfNeeded(supabaseAdmin, userId);

  const { error: deleteAuthError } = await supabaseAdmin.auth.admin.deleteUser(userId);
  if (deleteAuthError) throw deleteAuthError;

  return { success: true };
});
