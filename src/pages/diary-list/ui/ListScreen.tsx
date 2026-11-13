import { router } from 'expo-router';
import { useCallback, useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';

import { DiaryListCard, useDiaryPages } from '@/entities/diary';
import type { DiaryListItem } from '@/entities/diary';
import { useWalkStore } from '@/entities/walk';
import { useConfirmLogout } from '@/features/auth';
import { SettingsDrawer } from '@/features/settings';
import { colors, spacing } from '@/shared/config/theme';
import { Chip } from '@/shared/ui/Chip';
import { TabAppBar } from '@/shared/ui/TabAppBar';

const THUMBNAIL_SIZE = 50;

export function ListScreen() {
  const [sortByDate, setSortByDate] = useState(false);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const confirmLogout = useConfirmLogout();
  // '날짜별'은 오래된 날짜부터 보여준다
  const { data, isLoading, hasNextPage, isFetchingNextPage, fetchNextPage } = useDiaryPages({
    ascending: sortByDate,
  });
  const diaries = data?.pages.flat() ?? [];
  const pendingPhotosByWalkId = useWalkStore((s) => s.pendingWalkPhotosByWalkId);

  const openDiary = useCallback(
    (diary: DiaryListItem) => router.push(`/diary/${diary.diaryId}`),
    [],
  );
  const renderItem = useCallback(
    ({ item }: { item: DiaryListItem }) => (
      <DiaryListCard
        diary={item}
        pendingPhotosByWalkId={pendingPhotosByWalkId}
        thumbnailSize={THUMBNAIL_SIZE}
        showWalkMeta
        onPress={openDiary}
        style={styles.card}
      />
    ),
    [openDiary, pendingPhotosByWalkId],
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
          data={diaries}
          keyExtractor={(item) => item.diaryId}
          renderItem={renderItem}
          onEndReached={() => {
            if (hasNextPage && !isFetchingNextPage) fetchNextPage();
          }}
          onEndReachedThreshold={0.5}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <Text style={styles.empty}>{isLoading ? '불러오는 중...' : '일기가 없어요'}</Text>
          }
        />
      </View>

      <SettingsDrawer
        visible={drawerVisible}
        onClose={() => setDrawerVisible(false)}
        onLogout={confirmLogout}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  headerArea: { paddingHorizontal: spacing.md, paddingTop: spacing.md },
  sortRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.xs },
  list: { padding: spacing.md, paddingTop: spacing.xs, gap: spacing.sm },
  card: { marginBottom: spacing.sm },
  empty: { textAlign: 'center', color: colors.fgMuted, marginTop: spacing.xl },
});
