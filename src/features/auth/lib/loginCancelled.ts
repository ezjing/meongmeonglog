import { AppError } from '@/shared/lib/AppError';

const LOGIN_CANCELLED = 'auth_cancelled';

/** 사용자가 로그인 화면을 닫거나 동의를 거절한 경우 (실패가 아니라 안내로 보여준다) */
export function loginCancelledError(): AppError {
  return new AppError(LOGIN_CANCELLED, '로그인이 취소되었습니다.');
}

export function isLoginCancelled(error: unknown): boolean {
  return error instanceof AppError && error.code === LOGIN_CANCELLED;
}
