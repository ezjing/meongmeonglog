import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import { Image } from 'react-native';

import { AppError } from '@/shared/lib/AppError';

import { readStorageImageBytes } from './readStorageImageBytes';
import { supabase, isSupabaseConfigured } from './supabase';

type StorageBucket = 'dog-profiles' | 'walk-photos';

/** 긴 변 최대 길이. 산책 사진은 일기 생성(이미지 분석)과 크게 보기에 충분한 크기, 프로필은 작은 원형 표시용 */
const MAX_IMAGE_EDGE: Record<StorageBucket, number> = {
  'walk-photos': 1600,
  'dog-profiles': 512,
};

function getImageSize(uri: string): Promise<{ width: number; height: number } | null> {
  return new Promise((resolve) => {
    Image.getSize(
      uri,
      (width, height) => resolve({ width, height }),
      () => resolve(null),
    );
  });
}

async function normalizeImageForUpload(
  uri: string,
  maxEdge: number,
): Promise<{ uri: string; contentType: string; ext: string }> {
  // 긴 변 기준으로 큰 사진만 줄인다 (작은 사진을 키우지 않음). 크기를 모르면 가로 기준으로 줄인다
  const size = await getImageSize(uri);
  const actions =
    size == null
      ? [{ resize: { width: maxEdge } }]
      : Math.max(size.width, size.height) <= maxEdge
        ? []
        : size.width >= size.height
          ? [{ resize: { width: maxEdge } }]
          : [{ resize: { height: maxEdge } }];

  const result = await manipulateAsync(uri, actions, {
    compress: 0.8,
    format: SaveFormat.JPEG,
  });

  return {
    uri: result.uri,
    contentType: 'image/jpeg',
    ext: 'jpg',
  };
}

export async function uploadStorageImage(
  bucket: StorageBucket,
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

  const normalized = await normalizeImageForUpload(uri, MAX_IMAGE_EDGE[bucket]);
  const bytes = await readStorageImageBytes(normalized.uri);

  const { error: uploadError } = await supabase.storage
    .from(bucket)
    .upload(path, bytes, { upsert: true, contentType: normalized.contentType });

  if (uploadError) {
    throw new AppError('storage_upload_failed', uploadError.message);
  }

  const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(path);
  return urlData.publicUrl;
}
