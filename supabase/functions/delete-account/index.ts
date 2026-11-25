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

function pathFromPublicUrl(url: string | null, bucket: string): string | null {
  if (!url) return null;
  const marker = `/object/public/${bucket}/`;
  const index = url.indexOf(marker);
  if (index === -1) return null;
  const path = url.slice(index + marker.length).split('?')[0];
  try {
    return decodeURIComponent(path);
  } catch {
    return path;
  }
}

async function removeStoragePaths(supabaseAdmin: SupabaseClient, bucket: string, paths: string[]) {
  const unique = [...new Set(paths)];
  for (let i = 0; i < unique.length; i += LIST_PAGE_SIZE) {
    const chunk = unique.slice(i, i + LIST_PAGE_SIZE);
    if (chunk.length === 0) continue;
    const { error } = await supabaseAdmin.storage.from(bucket).remove(chunk);
    if (error) throw error;
  }
}

interface HouseholdFiles {
  walkFolders: string[];
  dogPaths: string[];
}

async function loadHouseholdFiles(
  supabaseAdmin: SupabaseClient,
  householdIds: string[],
): Promise<HouseholdFiles> {
  if (householdIds.length === 0) return { walkFolders: [], dogPaths: [] };

  const { data: dogs, error: dogError } = await supabaseAdmin
    .from('dogs')
    .select('id, profile_image_url')
    .in('household_id', householdIds);
  if (dogError) throw dogError;

  const dogPaths = (dogs ?? [])
    .map((dog) => pathFromPublicUrl(dog.profile_image_url, 'dog-profiles'))
    .filter((path): path is string => path != null);

  const dogIds = (dogs ?? []).map((dog) => dog.id as string);
  if (dogIds.length === 0) return { walkFolders: [], dogPaths };

  // 산책 id를 주소에 넣으면 기록이 많을 때 길이 제한으로 탈퇴가 실패한다.
  // 강아지 id로 산책을 조인해 사진을 한 번에 가져온다.
  const { data: photos, error: photoError } = await supabaseAdmin
    .from('walk_photos')
    .select('image_url, walks!inner(dog_id)')
    .in('walks.dog_id', dogIds);
  if (photoError) throw photoError;

  const folders = new Set<string>();
  for (const photo of photos ?? []) {
    const path = pathFromPublicUrl(photo.image_url, 'walk-photos');
    if (!path) continue;
    const [ownerId, walkId] = path.split('/');
    if (ownerId && walkId) folders.add(`${ownerId}/${walkId}`);
  }

  return { walkFolders: [...folders], dogPaths };
}

function isKeptUserFile(
  path: string,
  userId: string,
  keepWalkIds: Set<string>,
  keepDogPaths: Set<string>,
) {
  if (keepDogPaths.has(path)) return true;
  const [ownerId, walkId] = path.split('/');
  return ownerId === userId && keepWalkIds.has(walkId ?? '');
}

interface SuccessorChoice {
  householdId: string;
  userId: string;
}

function readSuccessors(body: unknown): SuccessorChoice[] {
  if (!body || typeof body !== 'object' || !('successors' in body)) return [];
  const value = (body as { successors?: unknown }).successors;
  if (!Array.isArray(value)) return [];

  return value.flatMap((item) => {
    if (!item || typeof item !== 'object') return [];
    const householdId = (item as { householdId?: unknown }).householdId;
    const successorId = (item as { userId?: unknown }).userId;
    if (typeof householdId !== 'string' || typeof successorId !== 'string') return [];
    return [{ householdId, userId: successorId }];
  });
}

async function deleteAccountFiles(
  supabaseAdmin: SupabaseClient,
  userId: string,
  keepHouseholdIds: string[],
  dropHouseholdIds: string[],
) {
  const [keepFiles, dropFiles] = await Promise.all([
    loadHouseholdFiles(supabaseAdmin, keepHouseholdIds),
    loadHouseholdFiles(supabaseAdmin, dropHouseholdIds),
  ]);

  const keepWalkIds = new Set(
    keepFiles.walkFolders
      .filter((folder) => folder.startsWith(`${userId}/`))
      .map((folder) => folder.split('/')[1] ?? ''),
  );
  const keepDogPaths = new Set(keepFiles.dogPaths.filter((path) => path.startsWith(`${userId}/`)));

  await Promise.all(
    STORAGE_BUCKETS.map(async (bucket) => {
      const paths = await listAllFilePaths(supabaseAdmin, bucket, userId);
      const removing =
        bucket === 'share-cards'
          ? paths
          : paths.filter((path) => !isKeptUserFile(path, userId, keepWalkIds, keepDogPaths));
      await removeStoragePaths(supabaseAdmin, bucket, removing);
    }),
  );

  await Promise.all(
    dropFiles.walkFolders.map(async (folder) => {
      const paths = await listAllFilePaths(supabaseAdmin, 'walk-photos', folder);
      await removeStoragePaths(supabaseAdmin, 'walk-photos', paths);
    }),
  );
  await removeStoragePaths(supabaseAdmin, 'dog-profiles', dropFiles.dogPaths);
}

serveJson(async (req) => {
  const supabaseAdmin = createAdminClient();
  const userId = await getRequestUserId(req, supabaseAdmin);
  const successors = readSuccessors(await req.json().catch(() => ({})));

  // 새 관리자가 빠졌거나 그 집 구성원이 아니면 파일을 지우기 전에 실패한다.
  const { data: transfer, error: transferError } = await supabaseAdmin.rpc(
    'transfer_household_admins',
    { target_user: userId, successors },
  );
  if (transferError) throw new Error('계정 삭제에 실패했습니다.');

  const result = transfer as { dropHouseholdIds?: string[]; keepHouseholdIds?: string[] } | null;
  const dropHouseholdIds = result?.dropHouseholdIds ?? [];
  const keepHouseholdIds = result?.keepHouseholdIds ?? [];

  // 파일 삭제가 실패하면 계정을 지우기 전에 중단한다 (재시도 가능하도록).
  // 남는 집의 사진 파일은 지우지 않는다. 혼자인 집만 사진까지 지운다.
  await deleteAccountFiles(supabaseAdmin, userId, keepHouseholdIds, dropHouseholdIds);

  if (dropHouseholdIds.length > 0) {
    const { error: dropError } = await supabaseAdmin
      .from('households')
      .delete()
      .in('id', dropHouseholdIds);
    if (dropError) throw dropError;
  }

  await unlinkKakaoIfNeeded(supabaseAdmin, userId);

  const { error: deleteAuthError } = await supabaseAdmin.auth.admin.deleteUser(userId);
  if (deleteAuthError) throw deleteAuthError;

  return { success: true };
});
