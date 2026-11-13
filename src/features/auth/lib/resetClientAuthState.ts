import { useWalkStore } from '@/entities/walk';
import { queryClient } from '@/shared/api/queryClient';
import { useAuthStore } from '@/shared/session/sessionStore';

/** 로그아웃·탈퇴·세션 끊김 후 앱 메모리에 남은 사용자 상태(로그인, 진행 중 산책, 조회 캐시)를 비운다 */
export function resetClientAuthState(): void {
  useAuthStore.getState().clearSession();
  useWalkStore.getState().reset();
  queryClient.clear();
}
