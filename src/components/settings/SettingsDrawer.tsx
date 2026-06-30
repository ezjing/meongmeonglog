import { router } from 'expo-router';
import { useMemo } from 'react';

import { Drawer, type DrawerItem, useOverlay } from '@/components/ui/overlay';
import { useAuthSession, useDogs } from '@/hooks/useAuthSession';
import { requestLocationPermission } from '@/hooks/useWalkTracker';

interface SettingsDrawerProps {
  visible: boolean;
  onClose: () => void;
}

export function SettingsDrawer({ visible, onClose }: SettingsDrawerProps) {
  const { logout } = useAuthSession();
  const { data: dogs } = useDogs();
  const { showAlert, showToast } = useOverlay();
  const dog = dogs?.[0];

  const items = useMemo<DrawerItem[]>(
    () => [
      {
        icon: '🐶',
        label: '강아지 정보 관리',
        onPress: () => router.push('/(tabs)/settings'),
      },
      {
        icon: '🔔',
        label: '알림 설정',
        onPress: () => showToast({ message: '알림 설정은 준비 중이에요', variant: 'default' }),
      },
      {
        icon: '🎨',
        label: '테마 설정',
        onPress: () => showToast({ message: '테마 설정은 준비 중이에요', variant: 'default' }),
      },
      {
        icon: '📄',
        label: '이용약관 · 개인정보',
        onPress: () => showToast({ message: '약관 페이지는 준비 중이에요', variant: 'default' }),
      },
      {
        icon: '📍',
        label: '위치 권한 확인',
        onPress: async () => {
          const granted = await requestLocationPermission();
          showToast({
            message: granted
              ? '위치 권한이 허용되었어요'
              : '설정에서 위치 권한을 허용해주세요',
            variant: granted ? 'success' : 'warning',
          });
        },
      },
      {
        icon: '🚪',
        label: '로그아웃',
        danger: true,
        onPress: async () => {
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
        },
      },
    ],
    [logout, showAlert, showToast],
  );

  return (
    <Drawer
      visible={visible}
      onClose={onClose}
      profileName={dog ? `${dog.name} 보호자님` : '멍멍로그 사용자'}
      profileSubtitle={dog ? `${dog.breed} · 함께하는 중` : '강아지를 등록해주세요'}
      profileEmoji="🐶"
      items={items}
    />
  );
}
