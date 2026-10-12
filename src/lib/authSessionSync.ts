import { AppState } from 'react-native';

import { checkSupabaseSession, clearLocalAuth } from '@/lib/api/authApi';
import { loadAuthSession } from '@/lib/authStorage';
import { queryClient } from '@/lib/queryClient';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';
import { useAuthStore, useWalkStore } from '@/stores/walkStore';

/** 세션이 끊긴 기기의 로그인 상태를 정리한다. userId가 비워지면 Stack.Protected가 로그인 화면으로 보낸다 */
export async function handleSessionLost() {
  await clearLocalAuth();
  useAuthStore.getState().setSessionEndedElsewhere(true);
  useAuthStore.getState().clearSession();
  useWalkStore.getState().reset();
  queryClient.clear();
}

/**
 * 사용자당 세션 하나만 유지하므로 다른 기기에서 로그인하면 이 기기 세션은 서버에서 폐기된다.
 * - 토큰 갱신 실패(SIGNED_OUT) 시
 * - 앱이 다시 포그라운드로 올 때 서버에 세션을 확인해 폐기된 경우
 * 앱 로그인 상태를 정리한다.
 */
export function subscribeAuthSessionSync(): () => void {
  if (!isSupabaseConfigured) return () => {};

  const { data } = supabase.auth.onAuthStateChange((event) => {
    if (event !== 'SIGNED_OUT') return;
    if (!useAuthStore.getState().userId) return;
    // 콜백 안에서 supabase를 다시 호출하면 교착될 수 있어 다음 틱으로 미룬다
    setTimeout(() => {
      void (async () => {
        // 직접 로그아웃·탈퇴는 앱 로그인 정보를 먼저 지우므로 안내 대상이 아니다
        if (!(await loadAuthSession())) return;
        await handleSessionLost();
      })();
    }, 0);
  });

  const appStateSubscription = AppState.addEventListener('change', (state) => {
    if (state !== 'active') return;
    const userId = useAuthStore.getState().userId;
    if (!userId) return;
    void (async () => {
      if ((await checkSupabaseSession(userId)) === 'missing') {
        await handleSessionLost();
      }
    })();
  });

  return () => {
    data.subscription.unsubscribe();
    appStateSubscription.remove();
  };
}
