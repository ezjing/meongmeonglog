import type { AuthProvider } from '@/shared/api/database';
import { AppError } from '@/shared/lib/AppError';

import { PROVIDER_LABEL } from '../config/providers';

/** 로그인 실패 안내. 앱이 만든 문구만 쓰고, 그 외에는 제공자 이름 또는 일반 실패 문구를 쓴다. */
export function loginErrorMessage(error: unknown, provider: AuthProvider | null): string {
  if (error instanceof AppError) return error.message;
  if (provider) return `${PROVIDER_LABEL[provider]} 로그인에 실패했습니다.`;
  return '로그인에 실패했습니다.';
}
