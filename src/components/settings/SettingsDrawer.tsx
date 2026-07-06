import { router } from "expo-router";
import { useMemo } from "react";

import { Drawer, type DrawerItem, useOverlay } from "@/components/ui/overlay";
import { useAuthSession, useDogs } from "@/hooks/useAuthSession";
import { useGuardianProfile } from "@/hooks/useGuardianProfile";
import { requestLocationPermission } from "@/hooks/useWalkTracker";

interface SettingsDrawerProps {
  visible: boolean;
  onClose: () => void;
}

export function SettingsDrawer({ visible, onClose }: SettingsDrawerProps) {
  const { logout } = useAuthSession();
  const { data: dogs } = useDogs();
  const { data: guardianProfile } = useGuardianProfile();
  const { showAlert, showToast } = useOverlay();
  const dog = dogs?.[0];
  const guardianTitle = guardianProfile?.guardianTitle?.trim();

  const items = useMemo<DrawerItem[]>(
    () => [
      {
        icon: "🙂",
        label: "보호자 정보 관리",
        onPress: () =>
          router.push({
            pathname: "/(onboarding)/guardianBasic",
            params: { mode: "edit" },
          }),
      },
      {
        icon: "🐶",
        label: "강아지 정보 관리",
        onPress: () =>
          router.push({
            pathname: "/(onboarding)/dogBasic",
            params: { mode: "edit" },
          }),
      },
      {
        icon: "🔔",
        label: "알림 설정",
        onPress: () =>
          showToast({
            message: "알림 설정은 준비 중이에요",
            variant: "default",
          }),
      },
      {
        icon: "🎨",
        label: "테마 설정",
        onPress: () =>
          showToast({
            message: "테마 설정은 준비 중이에요",
            variant: "default",
          }),
      },
      {
        icon: "📄",
        label: "이용약관 · 개인정보",
        onPress: () =>
          showToast({
            message: "약관 페이지는 준비 중이에요",
            variant: "default",
          }),
      },
      {
        icon: "📍",
        label: "위치 권한 확인",
        onPress: async () => {
          const granted = await requestLocationPermission();
          showToast({
            message: granted
              ? "위치 권한이 허용되었어요"
              : "설정에서 위치 권한을 허용해주세요",
            variant: granted ? "success" : "warning",
          });
        },
      },
      {
        icon: "🚪",
        label: "로그아웃",
        danger: true,
        onPress: async () => {
          const confirmed = await showAlert({
            icon: "🚪",
            title: "로그아웃할까요?",
            message: "다시 로그인하면 이어서 이용할 수 있어요.",
            cancelLabel: "취소",
            confirmLabel: "로그아웃",
            destructive: true,
          });
          if (!confirmed) return;
          await logout();
          router.replace("/(auth)/login");
        },
      },
    ],
    [logout, showAlert, showToast],
  );

  const profileName = guardianTitle
    ? `${guardianTitle} 보호자님`
    : dog
      ? `${dog.name} 보호자님`
      : "멍멍로그 사용자";

  const profileSubtitle = dog
    ? [
        dog.breed,
        guardianProfile?.parentingStyle?.trim(),
        guardianProfile?.currentConcern?.trim()
          ? `고민: ${guardianProfile.currentConcern.trim()}`
          : null,
      ]
        .filter(Boolean)
        .join(" · ")
    : "강아지를 등록해주세요";

  return (
    <Drawer
      visible={visible}
      onClose={onClose}
      profileName={profileName}
      profileSubtitle={profileSubtitle}
      profileEmoji={guardianTitle ? "🙂" : "🐶"}
      profileImageUri={guardianProfile?.guardianProfileImageUrl}
      items={items}
    />
  );
}
