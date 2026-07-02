import { router } from "expo-router";
import { useState } from "react";
import { Dimensions, Pressable, StyleSheet, Text, View } from "react-native";

import { DiaryThumbnail } from "@/components/diary/DiaryThumbnail";
import { SettingsDrawer } from "@/components/settings/SettingsDrawer";
import { Card } from "@/components/ui/Card";
import { TabAppBar } from "@/components/ui/TabAppBar";
import { colors, spacing } from "@/constants/theme";
import { useCalendar, useDiaryList } from "@/hooks/useDiaries";
import {
  formatDate,
  formatDistance,
  formatDuration,
} from "@/lib/utils/formatDistance";
import { useWalkStore } from "@/stores/walkStore";
import type { DiaryListItem } from "@/types/domain";

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];
const CELL_SIZE = (Dimensions.get("window").width - 32) / 7;

export default function CalendarScreen() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [drawerVisible, setDrawerVisible] = useState(false);

  const { data: calendarDays } = useCalendar(year, month);
  const { data: dayDiaries, isLoading: isDayDiariesLoading } = useDiaryList(
    selectedDate ?? undefined,
  );
  const pendingPhotosByWalkId = useWalkStore(
    (s) => s.pendingWalkPhotosByWalkId,
  );

  const firstDay = new Date(year, month - 1, 1).getDay();
  const today = now.toISOString().slice(0, 10);

  const cells: (null | { date: string; hasDiary: boolean })[] = [
    ...Array(firstDay).fill(null),
    ...(calendarDays ?? []).map((d) => ({
      date: d.date,
      hasDiary: d.hasDiary,
    })),
  ];

  const renderDiaryCard = (diary: DiaryListItem) => (
    <Card
      key={diary.diaryId}
      style={styles.sheet}
      onTouchEnd={() => router.push(`/diary/${diary.diaryId}`)}
    >
      <DiaryThumbnail
        diary={diary}
        pendingPhotosByWalkId={pendingPhotosByWalkId}
      />
      <View style={styles.sheetBody}>
        <Text style={styles.sheetMeta}>
          {formatDate(diary.createdAt)}
          {diary.durationSec ? ` · ${formatDuration(diary.durationSec)}` : ""}
          {diary.distanceMeter
            ? ` · ${formatDistance(diary.distanceMeter)}`
            : ""}
        </Text>
        <Text style={styles.sheetQuote} numberOfLines={1}>
          {diary.dailyQuote}
        </Text>
      </View>
    </Card>
  );

  return (
    <>
      <View style={styles.container}>
        <TabAppBar title="캘린더" onMenuPress={() => setDrawerVisible(true)} />

        <View style={styles.monthNav}>
          <Pressable
            onPress={() =>
              month === 1
                ? (setYear(year - 1), setMonth(12))
                : setMonth(month - 1)
            }
          >
            <Text style={styles.nav}>‹</Text>
          </Pressable>
          <Text style={styles.monthTitle}>
            {year}년 {month}월
          </Text>
          <Pressable
            onPress={() =>
              month === 12
                ? (setYear(year + 1), setMonth(1))
                : setMonth(month + 1)
            }
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
            <View style={styles.sheetList}>
              {dayDiaries.map(renderDiaryCard)}
            </View>
          ) : (
            <Text style={styles.noDiary}>이 날짜에는 산책 기록이 없어요</Text>
          )
        ) : null}
      </View>

      <SettingsDrawer
        visible={drawerVisible}
        onClose={() => setDrawerVisible(false)}
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
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  nav: { fontSize: 20, color: colors.ink, padding: spacing.sm },
  monthTitle: { fontSize: 15, fontWeight: "700", color: colors.ink },
  weekRow: { flexDirection: "row", marginBottom: spacing.xs },
  weekday: { flex: 1, textAlign: "center", fontSize: 10, color: colors.grey },
  grid: { flexDirection: "row", flexWrap: "wrap" },
  cell: {
    width: CELL_SIZE,
    height: CELL_SIZE,
    padding: 5,
  },
  cellInner: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
  },
  todayCell: { backgroundColor: colors.apricot },
  diaryCell: { backgroundColor: colors.white },
  selectedCell: { borderWidth: 2, borderColor: colors.apricotDark },
  cellText: { fontSize: 11, color: "#5b5b66" },
  todayText: { color: colors.white, fontWeight: "800" },
  paw: { fontSize: 7, marginTop: 1 },
  sheetList: { marginTop: spacing.md, gap: spacing.sm },
  sheet: { flexDirection: "row", gap: spacing.sm, alignItems: "center" },
  sheetBody: { flex: 1 },
  sheetMeta: { fontSize: 10, color: colors.grey, marginBottom: 3 },
  sheetQuote: { fontSize: 12, fontWeight: "600", color: colors.ink },
  noDiary: {
    textAlign: "center",
    color: colors.grey,
    marginTop: spacing.lg,
    fontSize: 12,
  },
});
