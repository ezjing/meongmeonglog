import { File } from 'expo-file-system';

import { AppError } from '@/lib/AppError';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

function guessContentType(uri: string): string {
  const ext = uri.split('.').pop()?.split('?')[0]?.toLowerCase();
  if (ext === 'png') return 'image/png';
  if (ext === 'webp') return 'image/webp';
  if (ext === 'heic' || ext === 'heif') return 'image/heic';
  return 'image/jpeg';
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

  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError || !authData.user) {
    throw new AppError('storage_auth_required', '사진 업로드를 위해 로그인이 필요합니다.');
  }

  const contentType = guessContentType(uri);
  const bytes = await readImageBytes(uri);

  const { error: uploadError } = await supabase.storage
    .from(bucket)
    .upload(path, bytes, { upsert: true, contentType });

  if (uploadError) {
    throw new AppError('storage_upload_failed', uploadError.message);
  }

  const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(path);
  return urlData.publicUrl;
}
