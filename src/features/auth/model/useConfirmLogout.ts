import { router } from 'expo-router';
import { useCallback } from 'react';

import { useOverlay } from '@/shared/ui/overlay';

import { useAuthSession } from './useAuthSession';

/** 확인 창을 띄운 뒤 로그아웃하고 로그인 화면으로 보낸다 */
export function useConfirmLogout() {
  const { logout } = useAuthSession();
  const { showAlert } = useOverlay();

  return useCallback(async () => {
    const confirmed = await showAlert({
      icon: '🚪',
      title: '로그아웃할까요?',
      message: '다시 로그인하면 이어서 이용할 수 있어요.',
      cancelLabel: '취소',
      confirmLabel: '로그아웃',
      destructive: true,
    });
    if (!confirmed) return;
    await logout();
    router.replace('/(auth)/login');
  }, [logout, showAlert]);
}
