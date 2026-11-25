import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { formatWalkPartyName, useDogDisplayName, useSelectedDog } from '@/entities/dog';
import { guardianTitleOrDefault } from '@/entities/guardian';
import { useHouseholds } from '@/entities/household';
import {
  formatWalkWeather,
  getWalkDogIds,
  loadPersistedWalkState,
  useWalkStore,
} from '@/entities/walk';
import {
  getWalkElapsedSec,
  useAbandonWalk,
  useCompleteWalk,
  flushAllPendingDbLocations,
  useFinishWalkStore,
} from '@/features/walk-session';
import type { DogMeetingLevel } from '@/shared/api/database';
import {
  colors,
  spacing,
  radius,
  fontSize,
  fontWeight,
  lineHeight,
  borderWidth,
} from '@/shared/config/theme';
import { formatDistance, formatDuration } from '@/shared/lib/formatDistance';
import { pickImageFromCamera, pickImageFromLibrary } from '@/shared/lib/pickImage';
import { useBackConfirmAction } from '@/shared/lib/useBackConfirmAction';
import { useAuthStore } from '@/shared/session/sessionStore';
import { Button } from '@/shared/ui/Button';
import { Chip } from '@/shared/ui/Chip';
import { ImagePreviewModal } from '@/shared/ui/ImagePreviewModal';
import {
  KeyboardAwareScrollView,
  useScrollToEndOnFocus,
} from '@/shared/ui/KeyboardAwareScrollView';
import { LoadingOverlayScreen } from '@/shared/ui/LoadingOverlay';
import { BottomSheet, useOverlay } from '@/shared/ui/overlay';

const PHOTO_SIZE = 56;
const PHOTO_REMOVE_SIZE = 18;
const MEMO_MIN_HEIGHT = 50;

/** 산책 한 번에 첨부할 수 있는 사진 수 */
const MAX_WALK_PHOTOS = 5;

export function WalkFinishScreen() {
  const activeWalk = useWalkStore((s) => s.activeWalk);
  const frozenElapsedSec = useWalkStore((s) => s.frozenElapsedSec);
  const distanceMeter = useWalkStore((s) => s.distanceMeter);
  const { form, setPhotoUris, ensureDogs, togglePee, togglePoop, setDogMeetingLevel, setMemo } =
    useFinishWalkStore();
  const { dogs } = useSelectedDog();
  const fallbackName = useDogDisplayName();
  const userId = useAuthStore((s) => s.userId);
  const { data: households } = useHouseholds();
  const [companionIds, setCompanionIds] = useState<string[]>([]);

  const { complete } = useCompleteWalk();
  const { abandonWalk, isAbandoning } = useAbandonWalk();
  const { showAlert, showToast } = useOverlay();
  const dogIds = useMemo(() => (activeWalk ? getWalkDogIds(activeWalk) : []), [activeWalk]);
  const walkDogs = dogIds.map((dogId) => {
    const match = dogs?.find((item) => item.dogId === dogId);
    return { dogId, name: match?.name?.trim() || fallbackName };
  });
  const sections = walkDogs.length > 0 ? walkDogs : [{ dogId: '', name: fallbackName }];
  const householdId = dogs?.find((dog) => dogIds.includes(dog.dogId))?.householdId;
  const companionGroup = households?.find((item) => item.householdId === householdId);
  const companionChoices =
    companionGroup && userId
      ? companionGroup.members.filter((member) => member.userId !== userId)
      : [];
  const isMulti = dogIds.length > 1;
  const partyName = isMulti
    ? formatWalkPartyName(sections[0]?.name || fallbackName, dogIds.length - 1)
    : sections[0]?.name || fallbackName;
  const [photoSheetVisible, setPhotoSheetVisible] = useState(false);
  const [previewIndex, setPreviewIndex] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const isLeavingRef = useRef(false);
  const { ref: scrollRef, scrollToEnd } = useScrollToEndOnFocus();
  const allowLeaveRef = useRef<(() => void) | null>(null);

  const handleGoHomeLater = useCallback(async () => {
    if (!activeWalk || isAbandoning || isLeavingRef.current) return;

    const confirmed = await showAlert({
      icon: '🐾',
      title: '정말 나갈까요?',
      message: '작성 중인 내용과 지금까지의 산책 기록이 모두 사라져요. 저장되지 않아요.',
      cancelLabel: '계속 작성',
      confirmLabel: '나가기',
      destructive: true,
    });
    if (!confirmed) return;

    isLeavingRef.current = true;
    allowLeaveRef.current?.();

    try {
      await abandonWalk(activeWalk.walkId);
      router.dismissTo('/(tabs)');
    } catch {
      isLeavingRef.current = false;
      showToast({
        message: '나가기에 실패했어요. 잠시 후 다시 시도해 주세요.',
        variant: 'error',
      });
    }
  }, [abandonWalk, activeWalk, isAbandoning, showAlert, showToast]);

  const { allowLeave } = useBackConfirmAction(handleGoHomeLater, !!activeWalk);

  useEffect(() => {
    allowLeaveRef.current = allowLeave;
  }, [allowLeave]);

  useEffect(() => {
    if (dogIds.length > 0) ensureDogs(dogIds);
  }, [dogIds, ensureDogs]);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      await flushAllPendingDbLocations();
      if (cancelled || isLeavingRef.current) return;

      const persisted = await loadPersistedWalkState();
      if (cancelled || isLeavingRef.current) return;
      if (persisted) {
        useWalkStore.getState().hydrateFromPersisted(persisted);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const canGenerate = form.photoUris.length >= 1;
  const remainingSlots = Math.max(0, MAX_WALK_PHOTOS - form.photoUris.length);

  const appendPhotos = (uris: string[]) => {
    if (uris.length === 0) return;
    const merged = [...form.photoUris, ...uris].slice(0, MAX_WALK_PHOTOS);
    setPhotoUris(merged);
  };

  const handleRemovePhoto = (index: number) => {
    setPhotoUris(form.photoUris.filter((_, i) => i !== index));
  };

  const handlePickFromLibrary = async () => {
    if (remainingSlots <= 0) return;
    const uris = await pickImageFromLibrary({
      allowsMultipleSelection: true,
      selectionLimit: remainingSlots,
    });
    if (!uris) return;
    if (uris.length > remainingSlots) {
      showToast({
        message:
          form.photoUris.length === 0
            ? `최대 ${MAX_WALK_PHOTOS}장까지 첨부할 수 있어요. 그중 ${MAX_WALK_PHOTOS}장만 넣었어요.`
            : `최대 ${MAX_WALK_PHOTOS}장까지 첨부할 수 있어요. 남은 ${remainingSlots}장만 넣었어요.`,
        variant: 'warning',
      });
    }
    appendPhotos(uris);
  };

  const handlePickFromCamera = async () => {
    if (remainingSlots <= 0) return;
    const uris = await pickImageFromCamera();
    if (uris) appendPhotos(uris.slice(0, 1));
  };

  const handleGenerate = async () => {
    if (!activeWalk || isSaving) return;
    if (!canGenerate) {
      showToast({
        message: '사진을 1장 이상 첨부해주세요',
        variant: 'warning',
      });
      return;
    }

    setIsSaving(true);
    try {
      await complete(activeWalk, form, companionIds);
      allowLeave();
      router.push({
        pathname: '/diary/generate',
        params: { walkId: activeWalk.walkId, dogIds: dogIds.join(',') },
      });
    } catch {
      setIsSaving(false);
      showToast({
        message: '저장에 실패했어요. 잠시 후 다시 시도해 주세요.',
        variant: 'error',
      });
    }
  };

  const meetingOptions: { label: string; value: DogMeetingLevel }[] = [
    { label: '없음', value: 'NONE' },
    { label: '1~2마리', value: 'ONE_TO_TWO' },
    { label: '3마리 이상', value: 'THREE_OR_MORE' },
  ];

  return (
    <LoadingOverlayScreen
      loading={isSaving}
      title={`${partyName}의 일기를 만들 준비 중이에요`}
      subtitle="산책 기록 저장 · 사진 업로드 중"
    >
      <KeyboardAwareScrollView
        ref={scrollRef}
        style={styles.container}
        contentContainerStyle={styles.content}
      >
        <View style={styles.summaryBar}>
          <Chip label={`🚶 ${formatDistance(distanceMeter)}`} selected />
          <Chip
            label={`⏱ ${formatDuration(
              getWalkElapsedSec(frozenElapsedSec, activeWalk?.startedAt),
            )}`}
            selected
          />
          <Chip label={formatWalkWeather(activeWalk) ?? '🌡️ 날씨 조회 중'} selected />
        </View>

        <Text style={styles.label}>사진 업로드 (1~{MAX_WALK_PHOTOS}장)</Text>
        <View style={styles.photoGrid}>
          {form.photoUris.map((uri, i) => (
            <View key={`${uri}-${i}`} style={styles.photo}>
              <Pressable
                style={styles.photoTap}
                onPress={() => setPreviewIndex(i)}
                accessibilityLabel="사진 크게 보기"
              >
                <Image source={{ uri }} style={styles.photoImage} contentFit="cover" />
              </Pressable>
              <Pressable
                style={styles.photoRemove}
                onPress={() => handleRemovePhoto(i)}
                accessibilityLabel="사진 삭제"
              >
                <Text style={styles.photoRemoveText}>×</Text>
              </Pressable>
            </View>
          ))}
          {Array.from({ length: remainingSlots }).map((_, i) => (
            <Pressable
              key={`add-${i}`}
              style={styles.photoAdd}
              onPress={() => setPhotoSheetVisible(true)}
            >
              <Text style={styles.photoAddText}>+</Text>
            </Pressable>
          ))}
        </View>

        {sections.map((dog) => {
          const event = form.eventsByDogId[dog.dogId];
          return (
            <View key={dog.dogId || 'only'}>
              {isMulti ? <Text style={styles.dogSectionTitle}>{dog.name}</Text> : null}
              <Text style={styles.label}>배변 활동</Text>
              <View style={styles.row}>
                <Chip
                  label="소변"
                  selected={event?.peeSelected ?? false}
                  onPress={() => togglePee(dog.dogId)}
                />
                <Chip
                  label="대변"
                  selected={event?.poopSelected ?? false}
                  onPress={() => togglePoop(dog.dogId)}
                />
              </View>

              <Text style={styles.label}>친구 만남</Text>
              <View style={styles.row}>
                {meetingOptions.map((opt) => (
                  <Chip
                    key={opt.value}
                    label={opt.label}
                    selected={(event?.dogMeetingLevel ?? 'NONE') === opt.value}
                    onPress={() => setDogMeetingLevel(dog.dogId, opt.value)}
                  />
                ))}
              </View>
            </View>
          );
        })}

        {companionChoices.length > 0 ? (
          <>
            <Text style={styles.label}>같이 간 가족</Text>
            <View style={styles.row}>
              {companionChoices.map((member) => (
                <Chip
                  key={member.userId}
                  label={guardianTitleOrDefault(member.guardianTitle)}
                  selected={companionIds.includes(member.userId)}
                  onPress={() =>
                    setCompanionIds((current) =>
                      current.includes(member.userId)
                        ? current.filter((id) => id !== member.userId)
                        : [...current, member.userId],
                    )
                  }
                />
              ))}
            </View>
          </>
        ) : null}

        <TextInput
          style={styles.memo}
          placeholder="산책 중 재미있었던 일이나 기억에 남는 순간을 들려주세요! 🐾"
          placeholderTextColor={colors.fgSubtle}
          value={form.memo}
          onChangeText={setMemo}
          onFocus={scrollToEnd}
          multiline
        />

        <Button
          label={isMulti ? '🐾 다 같이 일기 쓰기' : `🐾 ${partyName} 일기 쓰기`}
          disabled={isSaving || isAbandoning}
          onPress={handleGenerate}
          style={styles.cta}
        />

        <Button
          label="그만두고 홈으로 돌아가기"
          variant="text"
          onPress={handleGoHomeLater}
          disabled={isAbandoning}
          style={styles.skipLink}
        />
      </KeyboardAwareScrollView>

      <BottomSheet
        visible={photoSheetVisible}
        onClose={() => setPhotoSheetVisible(false)}
        title="사진 추가하기"
        subtitle={`최대 ${MAX_WALK_PHOTOS}장까지 첨부할 수 있어요`}
        options={[
          { icon: '📷', label: '카메라로 촬영', onPress: handlePickFromCamera },
          {
            icon: '🖼️',
            label: '갤러리에서 선택',
            onPress: handlePickFromLibrary,
          },
        ]}
      />

      <ImagePreviewModal
        visible={previewIndex != null}
        imageUris={form.photoUris}
        initialIndex={previewIndex ?? 0}
        onClose={() => setPreviewIndex(null)}
      />
    </LoadingOverlayScreen>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.md, paddingBottom: spacing.xl },
  summaryBar: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  label: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.fgMuted,
    marginBottom: spacing.sm,
  },
  dogSectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.extrabold,
    color: colors.fg,
    marginBottom: spacing.sm,
  },
  photoGrid: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
    flexWrap: 'wrap',
  },
  photo: {
    width: PHOTO_SIZE,
    height: PHOTO_SIZE,
    borderRadius: radius.controlSm,
    backgroundColor: colors.surfacePlaceholder,
    overflow: 'hidden',
    position: 'relative',
  },
  photoTap: { width: '100%', height: '100%' },
  photoImage: { width: '100%', height: '100%' },
  photoRemove: {
    position: 'absolute',
    top: spacing.xxs,
    right: spacing.xxs,
    width: PHOTO_REMOVE_SIZE,
    height: PHOTO_REMOVE_SIZE,
    borderRadius: radius.full,
    backgroundColor: colors.overlayStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoRemoveText: {
    color: colors.fgInverse,
    fontSize: fontSize.base,
    fontWeight: fontWeight.bold,
    lineHeight: lineHeight.sm,
    marginTop: -spacing.xxs,
  },
  photoAdd: {
    width: PHOTO_SIZE,
    height: PHOTO_SIZE,
    borderRadius: radius.controlSm,
    backgroundColor: colors.surface,
    borderWidth: borderWidth.medium,
    borderStyle: 'dashed',
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoAddText: { fontSize: fontSize.lg, color: colors.fgMuted, fontWeight: fontWeight.bold },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  memo: {
    backgroundColor: colors.surface,
    borderWidth: borderWidth.medium,
    borderColor: colors.border,
    borderRadius: radius.control,
    padding: spacing.ms,
    minHeight: MEMO_MIN_HEIGHT,
    fontSize: fontSize.md,
    color: colors.fg,
    marginBottom: spacing.lg,
    textAlignVertical: 'top',
  },
  cta: { marginTop: spacing.sm },
  skipLink: { marginVertical: spacing.sm },
});
