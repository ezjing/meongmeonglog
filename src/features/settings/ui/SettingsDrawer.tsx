import { router } from 'expo-router';
import { useMemo } from 'react';

import { useDogs } from '@/entities/dog';
import { useGuardianProfile } from '@/entities/guardian';
import { useLocationPermissionCheck } from '@/shared/lib/useLocationPermissionCheck';
import { Drawer, type DrawerItem, useOverlay } from '@/shared/ui/overlay';

interface SettingsDrawerProps {
  visible: boolean;
  onClose: () => void;
  /** 로그아웃 흐름은 auth feature에 있으므로 화면에서 연결해 넘긴다 */
  onLogout: () => void;
}

export function SettingsDrawer({ visible, onClose, onLogout }: SettingsDrawerProps) {
  const checkLocationPermission = useLocationPermissionCheck();
  const { data: dogs } = useDogs();
  const { data: guardianProfile } = useGuardianProfile();
  const { showToast } = useOverlay();
  const dog = dogs?.[0];
  const guardianTitle = guardianProfile?.guardianTitle?.trim();

  const items = useMemo<DrawerItem[]>(
    () => [
      {
        icon: '🙂',
        label: '보호자 정보 관리',
        onPress: () =>
          router.push({
            pathname: '/(onboarding)/guardianBasic',
            params: { mode: 'edit' },
          }),
      },
      {
        icon: '🐶',
        label: '강아지 정보 관리',
        onPress: () =>
          router.push({
            pathname: '/(onboarding)/dogBasic',
            params: { mode: 'edit' },
          }),
      },
      {
        icon: '🔔',
        label: '알림 설정',
        onPress: () =>
          showToast({
            message: '알림 설정은 준비 중이에요',
            variant: 'default',
          }),
      },
      {
        icon: '🎨',
        label: '테마 설정',
        onPress: () =>
          showToast({
            message: '테마 설정은 준비 중이에요',
            variant: 'default',
          }),
      },
      {
        icon: '📄',
        label: '이용약관 · 개인정보',
        onPress: () =>
          showToast({
            message: '약관 페이지는 준비 중이에요',
            variant: 'default',
          }),
      },
      {
        icon: '📍',
        label: '위치 권한 확인',
        onPress: checkLocationPermission,
      },
      {
        icon: '🚪',
        label: '로그아웃',
        danger: true,
        onPress: onLogout,
      },
    ],
    [checkLocationPermission, onLogout, showToast],
  );

  const profileName = guardianTitle
    ? `${guardianTitle} 보호자님`
    : dog
      ? `${dog.name} 보호자님`
      : '멍멍로그 사용자';

  const profileSubtitle = dog
    ? [
        dog.breed,
        guardianProfile?.parentingStyle?.trim(),
        guardianProfile?.currentConcern?.trim()
          ? `고민: ${guardianProfile.currentConcern.trim()}`
          : null,
      ]
        .filter(Boolean)
        .join(' · ')
    : '강아지를 등록해주세요';

  return (
    <Drawer
      visible={visible}
      onClose={onClose}
      profileName={profileName}
      profileSubtitle={profileSubtitle}
      profileEmoji={guardianTitle ? '🙂' : '🐶'}
      profileImageUri={guardianProfile?.guardianProfileImageUrl}
      items={items}
    />
  );
}
