import { router } from 'expo-router';
import { useState } from 'react';
import { Dimensions, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { DiaryThumbnail, useCalendar, useDiaryList } from '@/entities/diary';
import type { DiaryListItem } from '@/entities/diary';
import { useWalkStore } from '@/entities/walk';
import { useConfirmLogout } from '@/features/auth';
import { SettingsDrawer } from '@/features/settings';
import { colors, spacing, radius, fontSize, fontWeight, borderWidth } from '@/shared/config/theme';
import { formatDate, formatDistance, formatDuration } from '@/shared/lib/formatDistance';
import { getLocalDateKey } from '@/shared/lib/localDate';
import { Card } from '@/shared/ui/Card';
import { TabAppBar } from '@/shared/ui/TabAppBar';

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];
const CELL_SIZE = (Dimensions.get('window').width - 32) / 7;

export function CalendarScreen() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const confirmLogout = useConfirmLogout();

  const { data: calendarDays } = useCalendar(year, month);
  const { data: dayDiaries, isLoading: isDayDiariesLoading } = useDiaryList(
    selectedDate ?? undefined,
  );
  const pendingPhotosByWalkId = useWalkStore((s) => s.pendingWalkPhotosByWalkId);

  const firstDay = new Date(year, month - 1, 1).getDay();
  const today = getLocalDateKey(now);

  const cells: (null | { date: string; hasDiary: boolean })[] = [
    ...Array(firstDay).fill(null),
    ...(calendarDays ?? []),
  ];

  const renderDiaryCard = (diary: DiaryListItem) => (
    <Pressable key={diary.diaryId} onPress={() => router.push(`/diary/${diary.diaryId}`)}>
      <Card style={styles.sheet}>
        <DiaryThumbnail diary={diary} pendingPhotosByWalkId={pendingPhotosByWalkId} />
        <View style={styles.sheetBody}>
          <Text style={styles.sheetMeta}>
            {formatDate(diary.createdAt)}
            {diary.durationSec ? ` · ${formatDuration(diary.durationSec)}` : ''}
            {diary.distanceMeter ? ` · ${formatDistance(diary.distanceMeter)}` : ''}
          </Text>
          <Text style={styles.sheetQuote} numberOfLines={1}>
            {diary.dailyQuote}
          </Text>
        </View>
      </Card>
    </Pressable>
  );

  return (
    <>
      <View style={styles.container}>
        <TabAppBar title="캘린더" onMenuPress={() => setDrawerVisible(true)} />

        <View style={styles.monthNav}>
          <Pressable
            onPress={() => (month === 1 ? (setYear(year - 1), setMonth(12)) : setMonth(month - 1))}
          >
            <Text style={styles.nav}>‹</Text>
          </Pressable>
          <Text style={styles.monthTitle}>
            {year}년 {month}월
          </Text>
          <Pressable
            onPress={() => (month === 12 ? (setYear(year + 1), setMonth(1)) : setMonth(month + 1))}
          >
            <Text style={styles.nav}>›</Text>
          </Pressable>
        </View>

        <View style={styles.weekRow}>
          {WEEKDAYS.map((d) => (
            <Text key={d} style={styles.weekday}>
              {d}
            </Text>
          ))}
        </View>

        <View style={styles.grid}>
          {cells.map((cell, i) => {
            if (!cell) return <View key={`empty-${i}`} style={styles.cell} />;
            const isToday = cell.date === today;
            const isSelected = cell.date === selectedDate;
            return (
              <Pressable
                key={cell.date}
                style={styles.cell}
                onPress={() => setSelectedDate(cell.date)}
              >
                <View
                  style={[
                    styles.cellInner,
                    cell.hasDiary && styles.diaryCell,
                    isToday && styles.todayCell,
                    isSelected && styles.selectedCell,
                  ]}
                >
                  <Text style={[styles.cellText, isToday && styles.todayText]}>
                    {parseInt(cell.date.slice(8), 10)}
                  </Text>
                  {cell.hasDiary ? <Text style={styles.paw}>🐾</Text> : null}
                </View>
              </Pressable>
            );
          })}
        </View>

        {selectedDate ? (
          isDayDiariesLoading ? (
            <Text style={styles.noDiary}>불러오는 중...</Text>
          ) : dayDiaries?.length ? (
            <ScrollView
              style={styles.sheetListScroll}
              contentContainerStyle={styles.sheetList}
              showsVerticalScrollIndicator={false}
            >
              {dayDiaries.map(renderDiaryCard)}
            </ScrollView>
          ) : (
            <Text style={styles.noDiary}>이 날짜에는 산책 기록이 없어요</Text>
          )
        ) : null}
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
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.md,
  },
  monthNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  nav: { fontSize: fontSize.xxl, color: colors.ink, padding: spacing.sm },
  monthTitle: { fontSize: fontSize.lg, fontWeight: fontWeight.bold, color: colors.ink },
  weekRow: { flexDirection: 'row', marginBottom: spacing.xs },
  weekday: { flex: 1, textAlign: 'center', fontSize: fontSize.xs, color: colors.grey },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: {
    width: CELL_SIZE,
    height: CELL_SIZE,
    padding: spacing.xs,
  },
  cellInner: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.sm,
  },
  todayCell: { backgroundColor: colors.apricot },
  diaryCell: { backgroundColor: colors.white },
  selectedCell: { borderWidth: borderWidth.thick, borderColor: colors.apricotDark },
  cellText: { fontSize: fontSize.sm, color: colors.inkSoft },
  todayText: { color: colors.white, fontWeight: fontWeight.extrabold },
  paw: { fontSize: fontSize.xxs, marginTop: spacing.xxs },
  sheetListScroll: { flex: 1, marginTop: spacing.md },
  sheetList: { gap: spacing.sm, paddingBottom: spacing.md },
  sheet: { flexDirection: 'row', gap: spacing.sm, alignItems: 'center' },
  sheetBody: { flex: 1 },
  sheetMeta: { fontSize: fontSize.xs, color: colors.grey, marginBottom: spacing.xs },
  sheetQuote: { fontSize: fontSize.md, fontWeight: fontWeight.semibold, color: colors.ink },
  noDiary: {
    textAlign: 'center',
    color: colors.grey,
    marginTop: spacing.lg,
    fontSize: fontSize.md,
  },
});
