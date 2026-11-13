import { create } from 'zustand';

import type { AuthProvider } from '@/shared/api/database';

/** 로그인한 사용자. 여러 entity·feature가 userId를 쓰므로 shared에 둔다 */
interface AuthStore {
  userId: string | null;
  provider: AuthProvider | null;
  setSession: (userId: string, provider: AuthProvider) => void;
  clearSession: () => void;
  /** 다른 기기 로그인 등으로 세션이 끊겨 로그아웃된 경우 로그인 화면에서 안내한다 */
  sessionEndedElsewhere: boolean;
  setSessionEndedElsewhere: (value: boolean) => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  userId: null,
  provider: null,
  setSession: (userId, provider) => set({ userId, provider }),
  clearSession: () => set({ userId: null, provider: null }),
  sessionEndedElsewhere: false,
  setSessionEndedElsewhere: (value) => set({ sessionEndedElsewhere: value }),
}));
