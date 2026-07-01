import { router } from 'expo-router';
import { useState } from 'react';
import { Dimensions, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { DiaryThumbnail } from '@/components/diary/DiaryThumbnail';
import { Card } from '@/components/ui/Card';
import { useDiaryList, useCalendar } from '@/hooks/useDiaries';
import { formatDate } from '@/lib/utils/formatDistance';
import { colors, spacing } from '@/constants/theme';
import { useWalkStore } from '@/stores/walkStore';

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];
const CELL_SIZE = (Dimensions.get('window').width - 32) / 7;

export default function CalendarScreen() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const { data: calendarDays } = useCalendar(year, month);
  const { data: dayDiaries } = useDiaryList(selectedDate ?? undefined);
  const pendingPhotosByWalkId = useWalkStore((s) => s.pendingWalkPhotosByWalkId);

  const firstDay = new Date(year, month - 1, 1).getDay();
  const daysInMonth = calendarDays?.length ?? 0;
  const today = now.toISOString().slice(0, 10);

  const cells: (null | { date: string; hasDiary: boolean })[] = [
    ...Array(firstDay).fill(null),
    ...(calendarDays ?? []).map((d) => ({ date: d.date, hasDiary: d.hasDiary })),
  ];

  const selectedDiary = dayDiaries?.[0];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => (month === 1 ? (setYear(year - 1), setMonth(12)) : setMonth(month - 1))}>
          <Text style={styles.nav}>‹</Text>
        </Pressable>
        <Text style={styles.monthTitle}>{year}년 {month}월</Text>
        <Pressable onPress={() => (month === 12 ? (setYear(year + 1), setMonth(1)) : setMonth(month + 1))}>
          <Text style={styles.nav}>›</Text>
        </Pressable>
      </View>

      <View style={styles.weekRow}>
        {WEEKDAYS.map((d) => (
          <Text key={d} style={styles.weekday}>{d}</Text>
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
              style={[styles.cell, isToday && styles.todayCell, isSelected && styles.selectedCell]}
              onPress={() => {
                setSelectedDate(cell.date);
                if (cell.hasDiary && dayDiaries?.[0]) {
                  router.push(`/diary/${dayDiaries[0].diaryId}`);
                }
              }}
            >
              <Text style={[styles.cellText, isToday && styles.todayText]}>
                {parseInt(cell.date.slice(8), 10)}
              </Text>
              {cell.hasDiary ? <Text style={styles.paw}>🐾</Text> : null}
            </Pressable>
          );
        })}
      </View>

      {selectedDiary ? (
        <Card style={styles.sheet}>
          <DiaryThumbnail
            diary={selectedDiary}
            pendingPhotosByWalkId={pendingPhotosByWalkId}
          />
          <View style={styles.sheetBody}>
            <Text style={styles.sheetDate}>{formatDate(selectedDiary.createdAt)}</Text>
            <Text style={styles.sheetQuote} numberOfLines={1}>{selectedDiary.dailyQuote}</Text>
          </View>
        </Card>
      ) : selectedDate ? (
        <Text style={styles.noDiary}>이 날짜에는 일기가 없어요</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: spacing.md },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
  nav: { fontSize: 20, color: colors.ink, padding: spacing.sm },
  monthTitle: { fontSize: 15, fontWeight: '700', color: colors.ink },
  weekRow: { flexDirection: 'row', marginBottom: spacing.xs },
  weekday: { flex: 1, textAlign: 'center', fontSize: 10, color: colors.grey },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: {
    width: CELL_SIZE,
    height: CELL_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
  todayCell: { backgroundColor: colors.apricot },
  selectedCell: { borderWidth: 2, borderColor: colors.apricotDark },
  cellText: { fontSize: 11, color: '#5b5b66' },
  todayText: { color: colors.white, fontWeight: '800' },
  paw: { fontSize: 7, marginTop: 1 },
  sheet: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md, alignItems: 'center' },
  sheetBody: { flex: 1 },
  sheetDate: { fontSize: 10, color: colors.grey },
  sheetQuote: { fontSize: 12, fontWeight: '600', color: colors.ink },
  noDiary: { textAlign: 'center', color: colors.grey, marginTop: spacing.lg, fontSize: 12 },
});
