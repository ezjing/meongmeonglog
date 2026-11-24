import type { WalkRow } from '@/shared/api/database';
import { uploadStorageImage, uploadWalkPhotoSmallCopy } from '@/shared/api/storageUpload';
import { supabase, isSupabaseConfigured } from '@/shared/api/supabase';
import { AppError } from '@/shared/lib/AppError';

import { getWalkDogIds, toWalkPhoto, toWalkSession } from '../lib/walkMappers';
import type { WalkEvent, WalkPhoto, WalkSession, WalkWeatherPayload } from '../model/types';

const mockWalks = new Map<string, WalkSession>();
const mockPhotos = new Map<string, WalkPhoto[]>();

/** dogIds[0]이 대표 강아지. 나머지는 walk_dogs에 넣는다 (대표 행은 DB 트리거) */
export async function startWalk(dogIds: string[]): Promise<WalkSession> {
  const representativeId = dogIds[0];
  if (!representativeId) {
    throw new AppError('walk_start_failed', 'dog_required');
  }

  if (!isSupabaseConfigured) {
    const walk: WalkSession = {
      walkId: `walk-${Date.now()}`,
      dogId: representativeId,
      dogIds,
      startedAt: new Date().toISOString(),
      endedAt: null,
      durationSec: null,
      distanceMeter: null,
      weatherCondition: null,
      weatherTemp: null,
      weatherIcon: null,
    };
    mockWalks.set(walk.walkId, walk);
    return walk;
  }

  const { data, error } = await supabase
    .from('walks')
    .insert({
      dog_id: representativeId,
      started_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) throw new AppError('walk_start_failed', error.message);

  const rest = dogIds.slice(1);
  if (rest.length > 0) {
    const { error: linkError } = await supabase.from('walk_dogs').insert(
      rest.map((dogId) => ({ walk_id: data.id, dog_id: dogId })),
    );
    if (linkError) {
      await supabase.from('walks').delete().eq('id', data.id);
      throw new AppError('walk_start_failed', linkError.message);
    }
  }

  return { ...toWalkSession(data as WalkRow), dogIds };
}

export async function updateWalkWeather(
  walkId: string,
  weather: WalkWeatherPayload,
): Promise<void> {
  if (!isSupabaseConfigured) {
    const walk = mockWalks.get(walkId);
    if (walk) {
      mockWalks.set(walkId, {
        ...walk,
        weatherCondition: weather.weatherCondition,
        weatherTemp: weather.weatherTemp,
        weatherIcon: weather.weatherIcon,
      });
    }
    return;
  }

  const { error } = await supabase
    .from('walks')
    .update({
      weather_condition: weather.weatherCondition,
      weather_temp: weather.weatherTemp,
      weather_icon: weather.weatherIcon,
    })
    .eq('id', walkId);

  if (error) throw new AppError('weather_update_failed', error.message);
}

export async function cancelWalk(walkId: string): Promise<void> {
  if (!isSupabaseConfigured) {
    mockWalks.delete(walkId);
    mockPhotos.delete(walkId);
    return;
  }

  const { error } = await supabase.from('walks').delete().eq('id', walkId);

  if (error) throw new AppError('walk_cancel_failed', error.message);
}

async function countDiariesForWalk(walkId: string): Promise<number> {
  const { count, error } = await supabase
    .from('diaries')
    .select('id', { count: 'exact', head: true })
    .eq('walk_id', walkId);
  if (error) throw new AppError('walk_delete_failed', error.message);
  return count ?? 0;
}

/** 일기 상세 삭제. 다른 강아지 일기가 남아 있으면 그 일기만, 마지막이면 산책 전체(사진 포함)를 지운다 */
export async function deleteDiaryFromWalk(diaryId: string, walkId: string): Promise<void> {
  if (!isSupabaseConfigured) {
    mockWalks.delete(walkId);
    mockPhotos.delete(walkId);
    return;
  }

  const remaining = await countDiariesForWalk(walkId);
  if (remaining <= 1) {
    await deleteWalk(walkId);
    return;
  }

  const { error } = await supabase.from('diaries').delete().eq('id', diaryId);
  if (error) throw new AppError('walk_delete_failed', error.message);
}

export async function countWalkDiaries(walkId: string): Promise<number> {
  if (!isSupabaseConfigured) return mockWalks.has(walkId) ? 1 : 0;
  return countDiariesForWalk(walkId);
}

function storagePathFromPublicUrl(url: string, bucket: string): string | null {
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

/** 사진이 올라간 폴더. 관리자가 다른 가족 사진을 지울 때도 올린 사람 폴더를 쓴다. */
async function walkPhotoFolders(walkId: string): Promise<string[]> {
  const { data: photos, error } = await supabase
    .from('walk_photos')
    .select('image_url')
    .eq('walk_id', walkId);
  if (error) throw new AppError('walk_delete_failed', error.message);

  const folders = new Set<string>();
  for (const photo of photos ?? []) {
    const path = storagePathFromPublicUrl(photo.image_url, 'walk-photos');
    if (!path) continue;
    const [ownerId, folderWalkId] = path.split('/');
    if (ownerId && folderWalkId) folders.add(`${ownerId}/${folderWalkId}`);
  }

  if (folders.size > 0) return [...folders];

  const { data: walk, error: walkError } = await supabase
    .from('walks')
    .select('recorded_by')
    .eq('id', walkId)
    .maybeSingle();
  if (walkError) throw new AppError('walk_delete_failed', walkError.message);
  if (walk?.recorded_by) return [`${walk.recorded_by}/${walkId}`];

  const { data: sessionData } = await supabase.auth.getSession();
  const ownerId = sessionData.session?.user.id;
  return ownerId ? [`${ownerId}/${walkId}`] : [];
}

/** 끝난 산책 하나를 지운다. 사진 파일을 먼저 지우고, 이어서 walks 행을 지운다 (일기·공유 링크는 cascade) */
export async function deleteWalk(walkId: string): Promise<void> {
  if (!isSupabaseConfigured) {
    mockWalks.delete(walkId);
    mockPhotos.delete(walkId);
    return;
  }

  const folders = await walkPhotoFolders(walkId);
  for (const folder of folders) {
    const { data: files, error: listError } = await supabase.storage.from('walk-photos').list(folder);
    if (listError) throw new AppError('walk_delete_failed', listError.message);

    const paths = (files ?? [])
      .filter((file) => file.name.length > 0)
      .map((file) => `${folder}/${file.name}`);
    if (paths.length === 0) continue;

    const { error: removeError } = await supabase.storage.from('walk-photos').remove(paths);
    if (removeError) throw new AppError('walk_delete_failed', removeError.message);
  }

  const { error } = await supabase.from('walks').delete().eq('id', walkId);
  if (error) throw new AppError('walk_delete_failed', error.message);
}

/** 한 번에 insert하는 좌표 수. 오프라인으로 많이 쌓였을 때 요청 하나가 너무 커지지 않게 나눈다 */
const LOCATION_INSERT_CHUNK_SIZE = 500;

/**
 * 좌표를 묶어서 저장한다. 앞에서부터 덩어리 단위로 보내고, 실패하면 그때까지 저장한 개수를 돌려준다.
 * recordedAt(측정 시각, ms)이 없는 이전 버전 좌표는 전송 시각으로 기록한다.
 */
export async function saveWalkLocations(
  walkId: string,
  locations: { latitude: number; longitude: number; recordedAt?: number }[],
): Promise<number> {
  if (!isSupabaseConfigured) return locations.length;

  let saved = 0;
  for (let i = 0; i < locations.length; i += LOCATION_INSERT_CHUNK_SIZE) {
    const chunk = locations.slice(i, i + LOCATION_INSERT_CHUNK_SIZE);
    const { error } = await supabase.from('walk_locations').insert(
      chunk.map((loc) => ({
        walk_id: walkId,
        latitude: loc.latitude,
        longitude: loc.longitude,
        recorded_at: new Date(loc.recordedAt ?? Date.now()).toISOString(),
      })),
    );
    if (error) break;
    saved += chunk.length;
  }
  return saved;
}

export async function finishWalk(
  walkId: string,
  payload: {
    endedAt: string;
    distanceMeter: number;
    durationSec: number;
    weatherCondition?: string;
    weatherTemp?: number;
    weatherIcon?: string;
  },
): Promise<WalkSession> {
  if (!isSupabaseConfigured) {
    const walk = mockWalks.get(walkId);
    if (!walk) throw new AppError('walk_not_found', '산책을 찾을 수 없습니다.');
    const updated = {
      ...walk,
      endedAt: payload.endedAt,
      distanceMeter: payload.distanceMeter,
      durationSec: payload.durationSec,
      weatherCondition: payload.weatherCondition ?? walk.weatherCondition,
      weatherTemp: payload.weatherTemp ?? walk.weatherTemp,
      weatherIcon: payload.weatherIcon ?? walk.weatherIcon,
    };
    mockWalks.set(walkId, updated);
    return updated;
  }

  const { data, error } = await supabase
    .from('walks')
    .update({
      ended_at: payload.endedAt,
      distance_meter: payload.distanceMeter,
      duration_sec: payload.durationSec,
      weather_condition: payload.weatherCondition,
      weather_temp: payload.weatherTemp,
      weather_icon: payload.weatherIcon,
    })
    .eq('id', walkId)
    .select()
    .single();

  if (error) throw new AppError('walk_finish_failed', error.message);
  return toWalkSession(data as WalkRow);
}

function toWalkEventRow(walkId: string, dogId: string, event: WalkEvent) {
  return {
    walk_id: walkId,
    dog_id: dogId,
    pee_count: event.peeCount,
    poop_count: event.poopCount,
    dog_meeting_level: event.dogMeetingLevel,
    memo: event.memo,
  };
}

export async function saveWalkEvent(walkId: string, dogId: string, event: WalkEvent): Promise<void> {
  if (!isSupabaseConfigured) return;

  const { error } = await supabase
    .from('walk_events')
    .upsert(toWalkEventRow(walkId, dogId, event), { onConflict: 'walk_id,dog_id' });

  if (error) throw new AppError('event_save_failed', error.message);
}

/** 강아지별 배변·친구 만남. 메모는 산책당 하나라 각 행에 같은 값을 넣는다 */
export async function saveWalkEvents(
  walkId: string,
  events: { dogId: string; event: WalkEvent }[],
): Promise<void> {
  if (!isSupabaseConfigured || events.length === 0) return;

  const { error } = await supabase.from('walk_events').upsert(
    events.map(({ dogId, event }) => toWalkEventRow(walkId, dogId, event)),
    { onConflict: 'walk_id,dog_id' },
  );

  if (error) throw new AppError('event_save_failed', error.message);
}

/** 산책에 포함된 강아지. 대표(walks.dog_id)가 첫 번째, 나머지는 등록이 빠른 순 */
export async function fetchWalkDogIds(walkId: string): Promise<string[]> {
  if (!isSupabaseConfigured) {
    const walk = mockWalks.get(walkId);
    return walk ? getWalkDogIds(walk) : [];
  }

  const { data: walk, error } = await supabase
    .from('walks')
    .select('dog_id')
    .eq('id', walkId)
    .maybeSingle();
  if (error) throw new AppError('fetch_walk_failed', error.message);
  if (!walk) return [];

  const { data: links, error: linkError } = await supabase
    .from('walk_dogs')
    .select('dog_id, dogs(created_at)')
    .eq('walk_id', walkId);
  if (linkError) throw new AppError('fetch_walk_failed', linkError.message);

  const createdAtById = new Map<string, string>();
  for (const link of links ?? []) {
    const dogs = link.dogs as { created_at: string } | { created_at: string }[] | null;
    const createdAt = Array.isArray(dogs) ? dogs[0]?.created_at : dogs?.created_at;
    createdAtById.set(link.dog_id, createdAt ?? '');
  }

  const rest = [...createdAtById.keys()]
    .filter((dogId) => dogId !== walk.dog_id)
    .sort((a, b) => (createdAtById.get(a) ?? '').localeCompare(createdAtById.get(b) ?? ''));

  return [walk.dog_id, ...rest];
}

export async function uploadWalkPhotos(walkId: string, uris: string[]): Promise<WalkPhoto[]> {
  if (!isSupabaseConfigured) {
    const photos = uris.map((uri, i) => ({
      id: `photo-${walkId}-${i}`,
      walkId,
      imageUrl: uri,
      sortOrder: i,
    }));
    mockPhotos.set(walkId, photos);
    return photos;
  }

  const { data: sessionData } = await supabase.auth.getSession();
  const ownerId = sessionData.session?.user.id;
  if (!ownerId) {
    throw new AppError('storage_auth_required', '사진 업로드를 위해 로그인이 필요합니다.');
  }

  // 이전 시도에서 일부만 저장된 사진 행을 정리 (재시도 시 중복 방지, 파일은 같은 경로로 덮어씀)
  const { error: clearError } = await supabase.from('walk_photos').delete().eq('walk_id', walkId);
  if (clearError) throw new AppError('photo_save_failed', clearError.message);

  // 원본과 Groq용 사본을 같이 올린다. 사본 실패는 무시하고 원본 주소만 저장한다
  const publicUrls = await Promise.all(
    uris.map(async (uri, i) => {
      const [url] = await Promise.all([
        uploadStorageImage('walk-photos', `${ownerId}/${walkId}/${i}.jpg`, uri),
        uploadWalkPhotoSmallCopy(`${ownerId}/${walkId}/${i}_small.jpg`, uri).catch(() => undefined),
      ]);
      return url;
    }),
  );

  const { data, error } = await supabase
    .from('walk_photos')
    .insert(
      publicUrls.map((imageUrl, i) => ({ walk_id: walkId, image_url: imageUrl, sort_order: i })),
    )
    .select();

  if (error) throw new AppError('photo_save_failed', error.message);
  return (data ?? []).map(toWalkPhoto).sort((a, b) => a.sortOrder - b.sortOrder);
}

export async function fetchWalkPhotos(walkId: string): Promise<WalkPhoto[]> {
  if (!isSupabaseConfigured) {
    return mockPhotos.get(walkId) ?? [];
  }

  const { data, error } = await supabase
    .from('walk_photos')
    .select('*')
    .eq('walk_id', walkId)
    .order('sort_order');

  if (error) throw new AppError('fetch_photos_failed', error.message);
  return data.map(toWalkPhoto);
}

export async function fetchWalk(walkId: string): Promise<WalkSession | null> {
  if (!isSupabaseConfigured) {
    return getMockWalk(walkId) ?? null;
  }

  const { data, error } = await supabase.from('walks').select('*').eq('id', walkId).maybeSingle();

  if (error) throw new AppError('fetch_walk_failed', error.message);
  if (!data) return null;

  return toWalkSession(data as WalkRow);
}

export function getMockWalk(walkId: string): WalkSession | undefined {
  return mockWalks.get(walkId);
}
