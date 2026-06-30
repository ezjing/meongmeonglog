import { router } from 'expo-router';
import { Image } from 'expo-image';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { Chip } from '@/components/ui/Chip';
import { BottomSheet, useOverlay } from '@/components/ui/overlay';
import {
  useFinishWalk,
  useSaveWalkEvent,
  useUploadWalkPhotos,
} from '@/hooks/useWalkMutations';
import { formatDistance, formatDuration } from '@/lib/utils/formatDistance';
import { pickImageFromCamera, pickImageFromLibrary } from '@/lib/pickImage';
import { colors, radius, spacing } from '@/constants/theme';
import { useFinishWalkStore, useWalkStore } from '@/stores/walkStore';
import type { DogMeetingLevel } from '@/types/database';

export default function WalkFinishScreen() {
  const activeWalk = useWalkStore((s) => s.activeWalk);
  const elapsedSec = useWalkStore((s) => s.elapsedSec);
  const distanceMeter = useWalkStore((s) => s.distanceMeter);
  const {
    form,
    setPhotoUris,
    togglePee,
    togglePoop,
    setDogMeetingLevel,
    setMemo,
    reset: resetForm,
  } = useFinishWalkStore();

  const finishWalk = useFinishWalk();
  const saveEvent = useSaveWalkEvent();
  const uploadPhotos = useUploadWalkPhotos();
  const { showToast } = useOverlay();
  const [photoSheetVisible, setPhotoSheetVisible] = useState(false);

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
    if (!activeWalk) return;
    if (!canGenerate) {
      showToast({ message: '⚠️ 사진을 1장 이상 첨부해주세요', variant: 'warning' });
      return;
    }

    await finishWalk.mutateAsync({
      walkId: activeWalk.walkId,
      payload: {
        endedAt: new Date().toISOString(),
        distanceMeter: Math.round(distanceMeter),
        durationSec: elapsedSec,
        weatherCondition: activeWalk.weatherCondition ?? '맑음',
        weatherTemp: activeWalk.weatherTemp ?? 23,
        weatherIcon: activeWalk.weatherIcon ?? '☀️',
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

    await uploadPhotos.mutateAsync({ walkId: activeWalk.walkId, uris: form.photoUris });

    resetForm();
    router.push({ pathname: '/diary/generate', params: { walkId: activeWalk.walkId } });
  };

  const meetingOptions: { label: string; value: DogMeetingLevel }[] = [
    { label: '없음', value: 'NONE' },
    { label: '1~2마리', value: 'ONE_TO_TWO' },
    { label: '3마리 이상', value: 'THREE_OR_MORE' },
  ];

  return (
    <>
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.summaryBar}>
        <Chip label={`🚶 ${formatDistance(distanceMeter)}`} selected />
        <Chip label={`⏱ ${formatDuration(elapsedSec)}`} selected />
        <Chip label={`☀️ ${activeWalk?.weatherTemp ?? 23}°C`} selected />
      </View>

      <Text style={styles.label}>사진 업로드 (1~5장)</Text>
      <View style={styles.photoGrid}>
        {form.photoUris.map((uri, i) => (
          <View key={`${uri}-${i}`} style={styles.photo}>
            <Image source={{ uri }} style={styles.photoImage} contentFit="cover" />
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
        placeholder="공원에서 뛰어놀았어요. 새 친구를 만나서 신났어요!"
        placeholderTextColor={colors.grey}
        value={form.memo}
        onChangeText={setMemo}
        multiline
      />

      <Button
        label="🐾 AI 일기 만들기"
        disabled={finishWalk.isPending}
        onPress={handleGenerate}
        style={styles.cta}
      />
    </ScrollView>

    <BottomSheet
      visible={photoSheetVisible}
      onClose={() => setPhotoSheetVisible(false)}
      title="사진 추가하기"
      subtitle="최대 5장까지 첨부할 수 있어요"
      options={[
        { icon: '📷', label: '카메라로 촬영', onPress: handlePickFromCamera },
        { icon: '🖼️', label: '갤러리에서 선택', onPress: handlePickFromLibrary },
      ]}
    />
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md, paddingBottom: spacing.xl },
  summaryBar: { flexDirection: 'row', gap: spacing.sm - 2, marginBottom: spacing.md },
  label: { fontSize: 12, fontWeight: '700', color: colors.grey, marginBottom: spacing.sm },
  photoGrid: { flexDirection: 'row', gap: spacing.sm - 2, marginBottom: spacing.md, flexWrap: 'wrap' },
  photo: {
    width: 56,
    height: 56,
    borderRadius: radius.sm - 1,
    backgroundColor: colors.clay,
    overflow: 'hidden',
    position: 'relative',
  },
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
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm - 2, marginBottom: spacing.md },
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
});
