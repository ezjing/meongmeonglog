import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { Chip } from '@/components/ui/Chip';
import {
  useFinishWalk,
  useSaveWalkEvent,
  useUploadWalkPhotos,
} from '@/hooks/useWalkMutations';
import { formatDistance, formatDuration } from '@/lib/utils/formatDistance';
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

  const canGenerate = form.photoUris.length >= 1;

  const handlePickPhotos = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') return;

    const result = await ImagePicker.launchImageLibraryAsync({
      allowsMultipleSelection: true,
      selectionLimit: 5,
      mediaTypes: ['images'],
      quality: 0.8,
    });

    if (!result.canceled) {
      setPhotoUris(result.assets.map((a) => a.uri).slice(0, 5));
    }
  };

  const handleGenerate = async () => {
    if (!activeWalk || !canGenerate) return;

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
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.summaryBar}>
        <Chip label={`🚶 ${formatDistance(distanceMeter)}`} selected />
        <Chip label={`⏱ ${formatDuration(elapsedSec)}`} selected />
        <Chip label={`☀️ ${activeWalk?.weatherTemp ?? 23}°C`} selected />
      </View>

      <Text style={styles.label}>사진 업로드 (1~5장)</Text>
      <View style={styles.photoGrid}>
        {form.photoUris.map((uri, i) => (
          <View key={uri} style={styles.photo}>
            <Text style={styles.photoEmoji}>🐶</Text>
          </View>
        ))}
        {Array.from({ length: Math.max(0, 5 - form.photoUris.length) }).map((_, i) => (
          <Button
            key={`add-${i}`}
            label="+"
            variant="soft"
            onPress={handlePickPhotos}
            style={styles.photoAdd}
          />
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
        disabled={!canGenerate || finishWalk.isPending}
        onPress={handleGenerate}
        style={styles.cta}
      />
    </ScrollView>
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
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoEmoji: { fontSize: 20 },
  photoAdd: { width: 56, height: 56, paddingVertical: 0 },
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
