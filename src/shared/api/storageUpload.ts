import { File } from 'expo-file-system';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';

import { AppError } from '@/shared/lib/AppError';

import { supabase, isSupabaseConfigured } from './supabase';

const MAX_GROQ_IMAGE_EDGE = 2048;

async function normalizeImageForUpload(
  uri: string,
): Promise<{ uri: string; contentType: string; ext: string }> {
  const result = await manipulateAsync(uri, [{ resize: { width: MAX_GROQ_IMAGE_EDGE } }], {
    compress: 0.8,
    format: SaveFormat.JPEG,
  });

  return {
    uri: result.uri,
    contentType: 'image/jpeg',
    ext: 'jpg',
  };
}

async function readImageBytes(uri: string): Promise<ArrayBuffer> {
  const file = new File(uri);
  return file.arrayBuffer();
}

export async function uploadStorageImage(
  bucket: 'dog-profiles' | 'walk-photos' | 'share-cards',
  path: string,
  uri: string,
): Promise<string> {
  if (!isSupabaseConfigured) {
    return uri;
  }

  // 서버 권한은 Storage 정책이 검사하므로 여기서는 기기에 저장된 세션만 확인한다 (네트워크 요청 없음)
  const { data: sessionData } = await supabase.auth.getSession();
  const authUserId = sessionData.session?.user.id;
  if (!authUserId) {
    throw new AppError('storage_auth_required', '사진 업로드를 위해 로그인이 필요합니다.');
  }
  if (!path.startsWith(`${authUserId}/`)) {
    throw new AppError('storage_user_mismatch', '로그인 사용자와 업로드 경로가 일치하지 않습니다.');
  }

  const normalized = await normalizeImageForUpload(uri);
  const bytes = await readImageBytes(normalized.uri);

  const { error: uploadError } = await supabase.storage
    .from(bucket)
    .upload(path, bytes, { upsert: true, contentType: normalized.contentType });

  if (uploadError) {
    throw new AppError('storage_upload_failed', uploadError.message);
  }

  const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(path);
  return urlData.publicUrl;
}
