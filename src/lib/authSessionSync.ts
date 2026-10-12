import { clearLocalAuth } from '@/lib/api/authApi';
import { queryClient } from '@/lib/queryClient';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';
import { useAuthStore, useWalkStore } from '@/stores/walkStore';

async function handleSessionLost() {
  await clearLocalAuth();
  useAuthStore.getState().clearSession();
  useWalkStore.getState().reset();
  queryClient.clear();
}

/**
 * 토큰 갱신 실패 등으로 Supabase 세션이 끊기면 앱 로그인 상태도 함께 정리한다.
 * userId가 비워지면 Stack.Protected가 로그인 화면으로 보낸다.
 */
export function subscribeAuthSessionSync(): () => void {
  if (!isSupabaseConfigured) return () => {};

  const { data } = supabase.auth.onAuthStateChange((event) => {
    if (event !== 'SIGNED_OUT') return;
    // 직접 로그아웃한 경우는 이미 정리되어 있다
    if (!useAuthStore.getState().userId) return;
    // 콜백 안에서 supabase를 다시 호출하면 교착될 수 있어 다음 틱으로 미룬다
    setTimeout(() => {
      void handleSessionLost();
    }, 0);
  });

  return () => data.subscription.unsubscribe();
}
