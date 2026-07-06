import { Image } from "expo-image";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { GuardianProfileFields } from "@/components/guardian/GuardianProfileFields";
import { Button } from "@/components/ui/Button";
import { LoadingPaws } from "@/components/ui/LoadingPaws";
import { PawProgress } from "@/components/ui/PawProgress";
import { StackAppBar } from "@/components/ui/StackAppBar";
import { BottomSheet, useOverlay } from "@/components/ui/overlay";
import { colors, spacing } from "@/constants/theme";
import { useAuthSession } from "@/hooks/useAuthSession";
import {
  useGuardianProfile,
  useUpdateGuardianProfile,
} from "@/hooks/useGuardianProfile";
import { pickImageFromCamera, pickImageFromLibrary } from "@/lib/pickImage";

export default function GuardianBasicScreen() {
  const { mode } = useLocalSearchParams<{ mode?: string }>();
  const isEditMode = mode === "edit";
  const { logout } = useAuthSession();
  const { data: profile, isLoading: isProfileLoading } = useGuardianProfile();
  const updateProfile = useUpdateGuardianProfile();
  const { showAlert, showToast } = useOverlay();
  const [profileImageUri, setProfileImageUri] = useState<string | null>(null);
  const [photoSheetVisible, setPhotoSheetVisible] = useState(false);
  const [values, setValues] = useState({
    guardianTitle: "",
    parentingStyle: "",
    currentConcern: "",
  });

  useEffect(() => {
    if (!isEditMode || !profile) return;
    setValues({
      guardianTitle: profile.guardianTitle ?? "",
      parentingStyle: profile.parentingStyle ?? "",
      currentConcern: profile.currentConcern ?? "",
    });
    setProfileImageUri(profile.guardianProfileImageUrl);
  }, [isEditMode, profile]);

  const canNext = values.guardianTitle.trim().length > 0;

  const handleCancel = async () => {
    if (isEditMode) {
      router.back();
      return;
    }

    const confirmed = await showAlert({
      icon: "🐾",
      title: "등록을 취소할까요?",
      message: "입력한 내용은 저장되지 않아요.",
      cancelLabel: "계속 등록",
      confirmLabel: "취소하기",
      destructive: true,
    });
    if (!confirmed) return;
    await logout();
    router.replace("/(auth)/login");
  };

  const handlePickFromLibrary = async () => {
    const uris = await pickImageFromLibrary({
      allowsEditing: true,
      aspect: [1, 1],
    });
    if (uris?.[0]) {
      setProfileImageUri(uris[0]);
    }
  };

  const handlePickFromCamera = async () => {
    const uris = await pickImageFromCamera({
      allowsEditing: true,
      aspect: [1, 1],
    });
    if (uris?.[0]) {
      setProfileImageUri(uris[0]);
    }
  };

  const handleNext = async () => {
    try {
      await updateProfile.mutateAsync({
        guardianTitle: values.guardianTitle,
        parentingStyle: values.parentingStyle,
        currentConcern: values.currentConcern,
        profileImageUri:
          profileImageUri &&
          profileImageUri !== profile?.guardianProfileImageUrl
            ? profileImageUri
            : undefined,
      });
      if (isEditMode) {
        showToast({ message: "보호자 정보를 저장했어요", variant: "success" });
        router.back();
        return;
      }
      router.push("/(onboarding)/dogBasic");
    } catch {
      showToast({
        message: "⚠️ 보호자 정보 저장에 실패했어요",
        variant: "warning",
      });
    }
  };

  if (isEditMode && isProfileLoading) {
    return (
      <View style={styles.screen}>
        <StackAppBar
          title="보호자 정보 관리"
          onBackPress={() => router.back()}
        />
        <LoadingPaws message="보호자 정보를 불러오는 중" />
      </View>
    );
  }

  return (
    <>
      <View style={styles.screen}>
        {isEditMode ? (
          <StackAppBar
            title="보호자 정보 관리"
            onBackPress={() => router.back()}
          />
        ) : null}
        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          {!isEditMode ? (
            <View style={styles.progressWrap}>
              <PawProgress currentStep={1} />
            </View>
          ) : null}

          {!isEditMode ? (
            <>
              <Text style={styles.title}>먼저, 보호자님을 알려주세요</Text>
              <Text style={styles.subtitle}>
                AI 일기에서 보호자님을 부르는 호칭이에요
              </Text>
            </>
          ) : (
            <Text style={styles.editSubtitle}>
              AI 일기에 반영되는 호칭과 양육 정보를 수정할 수 있어요
            </Text>
          )}

          <Pressable
            style={styles.avatarWrap}
            onPress={() => setPhotoSheetVisible(true)}
          >
            <View style={styles.avatar}>
              {profileImageUri ? (
                <Image
                  source={{ uri: profileImageUri }}
                  style={styles.avatarImage}
                  contentFit="cover"
                />
              ) : (
                <Text style={styles.avatarEmoji}>🙂</Text>
              )}
            </View>
            <View style={styles.camBadge}>
              <Text style={styles.camEmoji}>📷</Text>
            </View>
          </Pressable>

          <GuardianProfileFields
            values={values}
            onChange={(next) => setValues((prev) => ({ ...prev, ...next }))}
          />
        </ScrollView>

        <View style={styles.footer}>
          <View style={styles.btnRow}>
            {!isEditMode ? (
              <Button
                label="이전"
                variant="soft"
                onPress={handleCancel}
                style={styles.prevBtn}
              />
            ) : null}
            <Button
              label={isEditMode ? "저장" : "다음"}
              disabled={!canNext || updateProfile.isPending}
              onPress={handleNext}
              style={isEditMode ? styles.singleBtn : styles.nextBtn}
            />
          </View>
        </View>
      </View>

      <BottomSheet
        visible={photoSheetVisible}
        onClose={() => setPhotoSheetVisible(false)}
        title="프로필 사진 추가"
        subtitle="보호자 프로필 사진을 등록해주세요"
        options={[
          { icon: "📷", label: "카메라로 촬영", onPress: handlePickFromCamera },
          {
            icon: "🖼️",
            label: "갤러리에서 선택",
            onPress: handlePickFromLibrary,
          },
        ]}
      />
    </>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
  },
  content: {
    padding: spacing.md,
    paddingBottom: spacing.md,
  },
  progressWrap: { marginBottom: spacing.sm, paddingHorizontal: spacing.xs },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.ink,
    marginTop: spacing.sm,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 11.5,
    color: colors.grey,
    marginBottom: 14,
  },
  editSubtitle: {
    fontSize: 11.5,
    color: colors.grey,
    marginBottom: 14,
    marginTop: spacing.xs,
  },
  avatarWrap: {
    alignSelf: "center",
    marginTop: 8,
    marginBottom: 16,
    position: "relative",
  },
  avatar: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: colors.clay,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: colors.white,
    borderStyle: "dashed",
    overflow: "hidden",
  },
  avatarImage: {
    width: "100%",
    height: "100%",
  },
  avatarEmoji: {
    fontSize: 30,
  },
  camBadge: {
    position: "absolute",
    right: -2,
    bottom: -2,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.ink,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: colors.background,
  },
  camEmoji: {
    fontSize: 12,
  },
  footer: {
    paddingVertical: 14,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.background,
  },
  btnRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  prevBtn: { flex: 1 },
  nextBtn: { flex: 2 },
  singleBtn: { flex: 1 },
});
