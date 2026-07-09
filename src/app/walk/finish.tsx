import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { Chip } from '@/components/ui/Chip';
import { ImagePreviewModal } from '@/components/ui/ImagePreviewModal';
import { LoadingOverlayScreen } from '@/components/ui/LoadingOverlay';
import { BottomSheet, useOverlay } from '@/components/ui/overlay';
import { colors, radius, spacing } from '@/constants/theme';
import { useBackConfirmAction } from '@/hooks/useBackConfirmAction';
import { useDogDisplayName } from '@/hooks/useDogName';
import { getElapsedSecFromStartedAt } from '@/hooks/useElapsedSec';
import {
  useCancelWalk,
  useFinishWalk,
  useSaveWalkEvent,
  useUploadWalkPhotos,
} from '@/hooks/useWalkMutations';
import { stopWalkTracking } from '@/hooks/useWalkTracker';
import { pickImageFromCamera, pickImageFromLibrary } from '@/lib/pickImage';
import { formatDistance, formatDuration } from '@/lib/utils/formatDistance';
import { flushAllPendingDbLocations } from '@/lib/walk/walkLocationProcessor';
import { loadPersistedWalkState } from '@/lib/walk/walkSessionStorage';
import { useFinishWalkStore, useWalkStore } from '@/stores/walkStore';
import type { DogMeetingLevel } from '@/types/database';

export default function WalkFinishScreen() {
  const activeWalk = useWalkStore((s) => s.activeWalk);
  const frozenElapsedSec = useWalkStore((s) => s.frozenElapsedSec);
  const distanceMeter = useWalkStore((s) => s.distanceMeter);
  const {
    form,
    setPhotoUris,
    togglePee,
    togglePoop,
    setDogMeetingLevel,
    setMemo,
    reset: resetFinishForm,
  } = useFinishWalkStore();

  const finishWalk = useFinishWalk();
  const saveEvent = useSaveWalkEvent();
  const uploadPhotos = useUploadWalkPhotos();
  const cancelWalk = useCancelWalk();
  const { showAlert, showToast } = useOverlay();
  const dogName = useDogDisplayName();
  const [photoSheetVisible, setPhotoSheetVisible] = useState(false);
  const [previewIndex, setPreviewIndex] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const backHandlerRef = useRef<() => void | Promise<void>>(() => {});
  const isLeavingRef = useRef(false);

  const { allowLeave } = useBackConfirmAction(() => backHandlerRef.current(), !!activeWalk);

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
  const remainingSlots = Math.max(0, 5 - form.photoUris.length);

  const appendPhotos = (uris: string[]) => {
    if (uris.length === 0) return;
    const merged = [...form.photoUris, ...uris].slice(0, 5);
    setPhotoUris(merged);
  };

  const handleRemovePhoto = (index: number) => {
    setPhotoUris(form.photoUris.filter((_, i) => i !== index));
  };

  const handlePickFromLibrary = async () => {
    const uris = await pickImageFromLibrary({
      allowsMultipleSelection: true,
      selectionLimit: remainingSlots,
    });
    if (uris) appendPhotos(uris);
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
        message: '⚠️ 사진을 1장 이상 첨부해주세요',
        variant: 'warning',
      });
      return;
    }

    setIsSaving(true);
    try {
      await flushAllPendingDbLocations();
      const persisted = await loadPersistedWalkState();
      const finalDistance = persisted?.distanceMeter ?? distanceMeter;
      const finalDuration = frozenElapsedSec ?? getElapsedSecFromStartedAt(activeWalk.startedAt);

      await finishWalk.mutateAsync({
        walkId: activeWalk.walkId,
        payload: {
          endedAt: new Date().toISOString(),
          distanceMeter: Math.round(finalDistance),
          durationSec: finalDuration,
          weatherCondition: activeWalk.weatherCondition ?? undefined,
          weatherTemp: activeWalk.weatherTemp ?? undefined,
          weatherIcon: activeWalk.weatherIcon ?? undefined,
        },
      });

      await saveEvent.mutateAsync({
        walkId: activeWalk.walkId,
        event: {
          peeCount: form.peeSelected ? 1 : 0,
          poopCount: form.poopSelected ? 1 : 0,
          dogMeetingLevel: form.dogMeetingLevel,
          memo: form.memo || null,
        },
      });

      const uploaded = await uploadPhotos.mutateAsync({
        walkId: activeWalk.walkId,
        uris: form.photoUris,
      });

      useWalkStore.getState().setPendingWalkPhotos(activeWalk.walkId, uploaded);
      await stopWalkTracking();
      useWalkStore.getState().reset();
      allowLeave();
      router.push({
        pathname: '/diary/generate',
        params: { walkId: activeWalk.walkId },
      });
    } catch {
      setIsSaving(false);
      showToast({
        message: '⚠️ 저장에 실패했어요. 잠시 후 다시 시도해 주세요.',
        variant: 'warning',
      });
    }
  };

  const handleGoHomeLater = async () => {
    if (!activeWalk || cancelWalk.isPending || isLeavingRef.current) return;

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
    allowLeave();

    try {
      await cancelWalk.mutateAsync(activeWalk.walkId);
      await stopWalkTracking();
      useWalkStore.getState().reset();
      resetFinishForm();
      router.replace('/(tabs)');
    } catch {
      isLeavingRef.current = false;
      showToast({
        message: '⚠️ 나가기에 실패했어요. 잠시 후 다시 시도해 주세요.',
        variant: 'warning',
      });
    }
  };

  backHandlerRef.current = handleGoHomeLater;

  const meetingOptions: { label: string; value: DogMeetingLevel }[] = [
    { label: '없음', value: 'NONE' },
    { label: '1~2마리', value: 'ONE_TO_TWO' },
    { label: '3마리 이상', value: 'THREE_OR_MORE' },
  ];

  return (
    <LoadingOverlayScreen
      loading={isSaving}
      title={`${dogName}의 일기를 만들 준비 중이에요`}
      subtitle="산책 기록 저장 · 사진 업로드 중"
    >
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.summaryBar}>
          <Chip label={`🚶 ${formatDistance(distanceMeter)}`} selected />
          <Chip
            label={`⏱ ${formatDuration(
              frozenElapsedSec ?? getElapsedSecFromStartedAt(activeWalk?.startedAt),
            )}`}
            selected
          />
          <Chip
            label={
              activeWalk?.weatherTemp != null
                ? `${activeWalk.weatherIcon ?? '🌡️'} ${activeWalk.weatherTemp}°C`
                : '🌡️ 날씨 조회 중'
            }
            selected
          />
        </View>

        <Text style={styles.label}>사진 업로드 (1~5장)</Text>
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

        <Text style={styles.label}>배변 활동</Text>
        <View style={styles.row}>
          <Chip label="소변" selected={form.peeSelected} onPress={togglePee} />
          <Chip label="대변" selected={form.poopSelected} onPress={togglePoop} />
        </View>

        <Text style={styles.label}>친구 만남</Text>
        <View style={styles.row}>
          {meetingOptions.map((opt) => (
            <Chip
              key={opt.value}
              label={opt.label}
              selected={form.dogMeetingLevel === opt.value}
              onPress={() => setDogMeetingLevel(opt.value)}
            />
          ))}
        </View>

        <TextInput
          style={styles.memo}
          placeholder="산책 중 재미있었던 일이나 기억에 남는 순간을 들려주세요! 🐾"
          placeholderTextColor={colors.grey}
          value={form.memo}
          onChangeText={setMemo}
          multiline
        />

        <Button
          label="🐾 AI 일기 만들기"
          disabled={isSaving || cancelWalk.isPending}
          onPress={handleGenerate}
          style={styles.cta}
        />

        <Pressable
          style={styles.skipLinkWrap}
          onPress={handleGoHomeLater}
          disabled={cancelWalk.isPending}
          accessibilityRole="button"
          accessibilityLabel="그만두고 홈으로 돌아가기"
        >
          <Text style={[styles.skipLink, cancelWalk.isPending && styles.skipLinkDisabled]}>
            그만두고 홈으로 돌아가기
          </Text>
        </Pressable>
      </ScrollView>

      <BottomSheet
        visible={photoSheetVisible}
        onClose={() => setPhotoSheetVisible(false)}
        title="사진 추가하기"
        subtitle="최대 5장까지 첨부할 수 있어요"
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
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md, paddingBottom: spacing.xl },
  summaryBar: {
    flexDirection: 'row',
    gap: spacing.sm - 2,
    marginBottom: spacing.md,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.grey,
    marginBottom: spacing.sm,
  },
  photoGrid: {
    flexDirection: 'row',
    gap: spacing.sm - 2,
    marginBottom: spacing.md,
    flexWrap: 'wrap',
  },
  photo: {
    width: 56,
    height: 56,
    borderRadius: radius.sm - 1,
    backgroundColor: colors.clay,
    overflow: 'hidden',
    position: 'relative',
  },
  photoTap: { width: '100%', height: '100%' },
  photoImage: { width: '100%', height: '100%' },
  photoRemove: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: 'rgba(43,43,61,0.72)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoRemoveText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 16,
    marginTop: -1,
  },
  photoAdd: {
    width: 56,
    height: 56,
    borderRadius: radius.sm - 1,
    backgroundColor: colors.white,
    borderWidth: 1.4,
    borderStyle: 'dashed',
    borderColor: colors.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoAddText: { fontSize: 16, color: colors.grey, fontWeight: '700' },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm - 2,
    marginBottom: spacing.md,
  },
  memo: {
    backgroundColor: colors.white,
    borderWidth: 1.3,
    borderColor: colors.line,
    borderRadius: radius.md - 2,
    padding: spacing.md - 4,
    minHeight: 50,
    fontSize: 12,
    color: colors.ink,
    marginBottom: spacing.lg,
    textAlignVertical: 'top',
  },
  cta: { marginTop: spacing.sm },
  skipLinkWrap: {
    alignItems: 'center',
    paddingTop: spacing.md,
    paddingBottom: spacing.md - 2,
  },
  skipLink: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.grey,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
    paddingBottom: 2,
  },
  skipLinkDisabled: { opacity: 0.5 },
});
