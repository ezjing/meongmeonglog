import { router } from 'expo-router';
import { useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';

import { DiaryThumbnail } from '@/components/diary/DiaryThumbnail';
import { SettingsDrawer } from '@/components/settings/SettingsDrawer';
import { Card } from '@/components/ui/Card';
import { Chip } from '@/components/ui/Chip';
import { TabAppBar } from '@/components/ui/TabAppBar';
import { colors, spacing } from '@/constants/theme';
import { useDiaryList } from '@/hooks/useDiaries';
import { formatDate, formatDistance, formatDuration } from '@/lib/utils/formatDistance';
import { useWalkStore } from '@/stores/walkStore';
import type { DiaryListItem } from '@/types/domain';

export default function ListScreen() {
  const [sortByDate, setSortByDate] = useState(false);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const { data: diaries, isLoading } = useDiaryList();
  const pendingPhotosByWalkId = useWalkStore((s) => s.pendingWalkPhotosByWalkId);

  const sorted = [...(diaries ?? [])].sort((a, b) => {
    if (sortByDate) {
      return a.createdAt.slice(0, 10).localeCompare(b.createdAt.slice(0, 10));
    }
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  const renderItem = ({ item }: { item: DiaryListItem }) => (
    <Card style={styles.card} onTouchEnd={() => router.push(`/diary/${item.diaryId}`)}>
      <DiaryThumbnail diary={item} pendingPhotosByWalkId={pendingPhotosByWalkId} size={50} />
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
    gap: spacing.sm + 2,
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  body: { flex: 1 },
  meta: { fontSize: 10, color: colors.grey, marginBottom: 3 },
  quote: { fontSize: 12, fontWeight: '600', color: colors.ink },
  empty: { textAlign: 'center', color: colors.grey, marginTop: spacing.xl },
});
