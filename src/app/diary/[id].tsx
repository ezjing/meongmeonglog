import { router, useLocalSearchParams } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { QuoteCard } from '@/components/ui/ScreenContainer';
import { useDiary } from '@/hooks/useDiaries';
import { fetchWalkPhotos } from '@/hooks/useWalkMutations';
import { formatDate, formatDistance, formatDuration } from '@/lib/utils/formatDistance';
import { colors, spacing } from '@/constants/theme';
import { useEffect, useState } from 'react';
import type { WalkPhoto } from '@/types/domain';

export default function DiaryDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: diary, isLoading } = useDiary(id ?? '');
  const [photos, setPhotos] = useState<WalkPhoto[]>([]);

  useEffect(() => {
    if (diary?.walkId) {
      fetchWalkPhotos(diary.walkId).then(setPhotos).catch(() => {});
    }
  }, [diary?.walkId]);

  if (isLoading || !diary) {
    return (
      <View style={styles.center}>
        <Text style={styles.loading}>{isLoading ? '불러오는 중...' : '일기를 찾을 수 없어요'}</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.hero}>
        <Button
          label="←"
          variant="soft"
          onPress={() => router.back()}
          style={styles.backBtn}
        />
        <Button
          label="↗"
          variant="soft"
          onPress={() => router.push(`/share/${diary.diaryId}`)}
          style={styles.shareBtn}
        />
      </View>

      <Card>
        <Text style={styles.title}>
          {diary.dogName ?? '코코'}의 일기 · {formatDate(diary.createdAt)}
        </Text>
        <Text style={styles.body}>{diary.content}</Text>
      </Card>

      <QuoteCard quote={diary.dailyQuote} />

      <View style={styles.metaRow}>
        {diary.distanceMeter ? (
          <Text style={styles.meta}>🚶 {formatDistance(diary.distanceMeter)}</Text>
        ) : null}
        {diary.durationSec ? (
          <Text style={styles.meta}>⏱ {formatDuration(diary.durationSec)}</Text>
        ) : null}
        {photos.length > 0 ? (
          <Text style={styles.meta}>📷 {photos.length}장</Text>
        ) : null}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md, paddingBottom: spacing.xl },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loading: { color: colors.grey },
  hero: {
    height: 140,
    borderRadius: 14,
    backgroundColor: colors.apricot,
    marginBottom: spacing.md,
    position: 'relative',
  },
  backBtn: { position: 'absolute', top: spacing.sm, left: spacing.sm, width: 36, paddingVertical: 6 },
  shareBtn: { position: 'absolute', top: spacing.sm, right: spacing.sm, width: 36, paddingVertical: 6 },
  title: { fontWeight: '800', fontSize: 14, color: colors.ink, marginBottom: spacing.sm },
  body: { fontSize: 13, lineHeight: 22, color: colors.ink },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.sm },
  meta: {
    fontSize: 11,
    backgroundColor: colors.white,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.xs,
    borderRadius: 999,
  },
});
