import { openBrowserAsync } from 'expo-web-browser';
import { useMemo } from 'react';

import { MAX_DOG_COUNT, useSelectedDog } from '@/entities/dog';
import { useGuardianProfile } from '@/entities/guardian';
import { isHouseholdAdmin, ownHouseholdId, useHouseholds } from '@/entities/household';
import { EXTERNAL_LINKS } from '@/shared/config/links';
import {
  openDogCreate,
  openDogEdit,
  openFamilyManage,
  openGuardianEdit,
} from '@/shared/lib/navigation';
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
  const { dog, dogs } = useSelectedDog();
  const { data: households } = useHouseholds();
  const { data: guardianProfile } = useGuardianProfile();
  const { showToast } = useOverlay();
  const guardianTitle = guardianProfile?.guardianTitle?.trim();

  const items = useMemo<DrawerItem[]>(
    () => [
      {
        icon: '🙂',
        label: '보호자 정보 관리',
        onPress: openGuardianEdit,
      },
      {
        icon: '🐶',
        label: '강아지 정보 관리',
        onPress: () => {
          if (!dog) return;
          if (households && !isHouseholdAdmin(households, dog.householdId)) {
            showToast({
              message: '강아지 정보는 집 관리자만 바꿀 수 있어요',
              variant: 'warning',
            });
            return;
          }
          openDogEdit(dog.dogId);
        },
      },
      {
        icon: '➕',
        label: '강아지 추가',
        onPress: () => {
          if (!dogs || !households) return;
          const ownId = ownHouseholdId(households);
          const ownCount = dogs.filter((item) => item.householdId === ownId).length;
          if (ownCount >= MAX_DOG_COUNT) {
            showToast({
              message: '강아지는 최대 10마리까지 등록할 수 있어요',
              variant: 'warning',
            });
            return;
          }
          openDogCreate();
        },
      },
      {
        icon: '🏠',
        label: '가족 관리',
        onPress: openFamilyManage,
      },
      {
        icon: '🔔',
        label: '알림 설정',
        onPress: () =>
          showToast({
            message: '알림 설정은 준비 중이에요',
            variant: 'warning',
          }),
      },
      {
        icon: '🎨',
        label: '테마 설정',
        onPress: () =>
          showToast({
            message: '테마 설정은 준비 중이에요',
            variant: 'warning',
          }),
      },
      {
        icon: '📃',
        label: '이용약관',
        onPress: () => openBrowserAsync(EXTERNAL_LINKS.termsOfService),
      },
      {
        icon: '🔒',
        label: '개인정보처리방침',
        onPress: () => openBrowserAsync(EXTERNAL_LINKS.privacyPolicy),
      },
      {
        icon: '🗂️',
        label: '계정 삭제 안내',
        onPress: () => openBrowserAsync(EXTERNAL_LINKS.accountDeletion),
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
    [checkLocationPermission, dog, dogs, households, onLogout, showToast],
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
