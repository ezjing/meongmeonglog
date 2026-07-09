import { AppError } from '@/lib/AppError';
import { toWalkSession } from '@/lib/mappers/walkMappers';
import { uploadStorageImage } from '@/lib/storageUpload';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import type { WalkRow } from '@/types/database';
import type { WalkEvent, WalkPhoto, WalkSession } from '@/types/domain';

const mockWalks = new Map<string, WalkSession>();
const mockPhotos = new Map<string, WalkPhoto[]>();
const mockEvents = new Map<string, WalkEvent>();

export interface WalkWeatherPayload {
  weatherCondition: string;
  weatherTemp: number;
  weatherIcon: string;
}

export async function startWalk(dogId: string, weather?: WalkWeatherPayload): Promise<WalkSession> {
  if (!isSupabaseConfigured) {
    const walk: WalkSession = {
      walkId: `walk-${Date.now()}`,
      dogId,
      startedAt: new Date().toISOString(),
      endedAt: null,
      durationSec: null,
      distanceMeter: null,
      weatherCondition: weather?.weatherCondition ?? null,
      weatherTemp: weather?.weatherTemp ?? null,
      weatherIcon: weather?.weatherIcon ?? null,
    };
    mockWalks.set(walk.walkId, walk);
    return walk;
  }

  const { data, error } = await supabase
    .from('walks')
    .insert({
      dog_id: dogId,
      started_at: new Date().toISOString(),
      weather_condition: weather?.weatherCondition,
      weather_temp: weather?.weatherTemp,
      weather_icon: weather?.weatherIcon,
    })
    .select()
    .single();

  if (error) throw new AppError('walk_start_failed', error.message);
  return toWalkSession(data as WalkRow);
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
    mockEvents.delete(walkId);
    return;
  }

  const { error } = await supabase.from('walks').delete().eq('id', walkId);

  if (error) throw new AppError('walk_cancel_failed', error.message);
}

export async function saveWalkLocation(
  walkId: string,
  latitude: number,
  longitude: number,
): Promise<void> {
  if (!isSupabaseConfigured) return;

  const { error } = await supabase.from('walk_locations').insert({
    walk_id: walkId,
    latitude,
    longitude,
    recorded_at: new Date().toISOString(),
  });

  if (error) throw new AppError('location_save_failed', error.message);
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

export async function saveWalkEvent(walkId: string, event: WalkEvent): Promise<void> {
  if (!isSupabaseConfigured) {
    mockEvents.set(walkId, event);
    return;
  }

  const { error } = await supabase.from('walk_events').upsert({
    walk_id: walkId,
    pee_count: event.peeCount,
    poop_count: event.poopCount,
    dog_meeting_level: event.dogMeetingLevel,
    memo: event.memo,
  });

  if (error) throw new AppError('event_save_failed', error.message);
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

  const uploaded: WalkPhoto[] = [];
  const { data: authData } = await supabase.auth.getUser();
  const ownerId = authData.user?.id;
  if (!ownerId) {
    throw new AppError('storage_auth_required', '사진 업로드를 위해 로그인이 필요합니다.');
  }

  for (let i = 0; i < uris.length; i++) {
    const uri = uris[i];
    const path = `${ownerId}/${walkId}/${i}.jpg`;
    const publicUrl = await uploadStorageImage('walk-photos', path, uri);

    const { data, error } = await supabase
      .from('walk_photos')
      .insert({
        walk_id: walkId,
        image_url: publicUrl,
        sort_order: i,
      })
      .select()
      .single();

    if (error) throw new AppError('photo_save_failed', error.message);
    uploaded.push({
      id: data.id,
      walkId,
      imageUrl: data.image_url,
      sortOrder: data.sort_order,
    });
  }
  return uploaded;
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
  return data.map((row) => ({
    id: row.id,
    walkId: row.walk_id,
    imageUrl: row.image_url,
    sortOrder: row.sort_order,
  }));
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

export function getMockEvent(walkId: string): WalkEvent | undefined {
  return mockEvents.get(walkId);
}
