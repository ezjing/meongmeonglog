import { router } from 'expo-router';
import { useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';

import { DiaryThumbnail } from '@/components/diary/DiaryThumbnail';
import { SettingsDrawer } from '@/components/settings/SettingsDrawer';
import { Card } from '@/components/ui/Card';
import { Chip } from '@/components/ui/Chip';
import { TabAppBar } from '@/components/ui/TabAppBar';
import { colors, spacing, fontSize, fontWeight } from '@/constants/theme';
import { useDiaryList } from '@/hooks/useDiaries';
import { formatDate, formatDistance, formatDuration } from '@/lib/utils/formatDistance';
import { getLocalDateKey } from '@/lib/utils/localDate';
import { useWalkStore } from '@/stores/walkStore';
import type { DiaryListItem } from '@/types/domain';

const THUMBNAIL_SIZE = 50;

export default function ListScreen() {
  const [sortByDate, setSortByDate] = useState(false);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const { data: diaries, isLoading } = useDiaryList();
  const pendingPhotosByWalkId = useWalkStore((s) => s.pendingWalkPhotosByWalkId);

  const sorted = [...(diaries ?? [])].sort((a, b) => {
    if (sortByDate) {
      return getLocalDateKey(a.createdAt).localeCompare(getLocalDateKey(b.createdAt));
    }
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  const renderItem = ({ item }: { item: DiaryListItem }) => (
    <Card style={styles.card} onTouchEnd={() => router.push(`/diary/${item.diaryId}`)}>
      <DiaryThumbnail
        diary={item}
        pendingPhotosByWalkId={pendingPhotosByWalkId}
        size={THUMBNAIL_SIZE}
      />
      <View style={styles.body}>
        <Text style={styles.meta}>
          {formatDate(item.createdAt)}
          {item.durationSec ? ` · ${formatDuration(item.durationSec)}` : ''}
          {item.distanceMeter ? ` · ${formatDistance(item.distanceMeter)}` : ''}
        </Text>
        <Text style={styles.quote} numberOfLines={1}>
          {item.dailyQuote}
        </Text>
      </View>
    </Card>
  );

  return (
    <>
      <View style={styles.container}>
        <View style={styles.headerArea}>
          <TabAppBar title="리스트" onMenuPress={() => setDrawerVisible(true)} />
          <View style={styles.sortRow}>
            <Chip label="최신순" selected={!sortByDate} onPress={() => setSortByDate(false)} />
            <Chip label="날짜별" selected={sortByDate} onPress={() => setSortByDate(true)} />
          </View>
        </View>

        <FlatList
          data={sorted}
          keyExtractor={(item) => item.diaryId}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <Text style={styles.empty}>{isLoading ? '불러오는 중...' : '일기가 없어요'}</Text>
          }
        />
      </View>

      <SettingsDrawer visible={drawerVisible} onClose={() => setDrawerVisible(false)} />
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  headerArea: { paddingHorizontal: spacing.md, paddingTop: spacing.md },
  sortRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.xs },
  list: { padding: spacing.md, paddingTop: spacing.xs, gap: spacing.sm },
  card: {
    flexDirection: 'row',
    gap: spacing.ms,
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  body: { flex: 1 },
  meta: { fontSize: fontSize.xs, color: colors.grey, marginBottom: spacing.xs },
  quote: { fontSize: fontSize.md, fontWeight: fontWeight.semibold, color: colors.ink },
  empty: { textAlign: 'center', color: colors.grey, marginTop: spacing.xl },
});
