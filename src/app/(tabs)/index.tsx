import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { DiaryThumbnail } from '@/components/diary/DiaryThumbnail';
import { DogAvatar } from '@/components/dog/DogAvatar';
import { SettingsDrawer } from '@/components/settings/SettingsDrawer';
import { Card } from '@/components/ui/Card';
import { useDogs } from '@/hooks/useAuthSession';
import { useDiaryList } from '@/hooks/useDiaries';
import { useStartWalk } from '@/hooks/useWalkMutations';
import { fetchCurrentWeather } from '@/lib/api/weatherApi';
import { getCurrentCoordinates, requestLocationPermission } from '@/hooks/useWalkTracker';
import { formatDate } from '@/lib/utils/formatDistance';
import { calculateAge } from '@/lib/utils/formatDistance';
import { colors, spacing } from '@/constants/theme';
import { useWalkStore } from '@/stores/walkStore';

export default function HomeScreen() {
  const { data: dogs } = useDogs();
  const { data: diaries } = useDiaryList();
  const startWalk = useStartWalk();
  const setActiveWalk = useWalkStore((s) => s.setActiveWalk);
  const resetWalk = useWalkStore((s) => s.reset);
  const pendingPhotosByWalkId = useWalkStore((s) => s.pendingWalkPhotosByWalkId);
  const [drawerVisible, setDrawerVisible] = useState(false);

  const dog = dogs?.[0];
  const sortedDiaries = [...(diaries ?? [])].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  const handleStartWalk = async () => {
    if (!dog) return;
    await requestLocationPermission();
    resetWalk();

    let weather: { weatherCondition: string; weatherTemp: number; weatherIcon: string } | undefined;
    try {
      const coords = await getCurrentCoordinates();
      if (coords) {
        const current = await fetchCurrentWeather(coords.latitude, coords.longitude);
        weather = {
          weatherCondition: current.condition,
          weatherTemp: current.temp,
          weatherIcon: current.icon,
        };
      }
    } catch {
      // 위치·날씨 조회 실패 시 산책 중 GPS로 다시 시도
    }

    const walk = await startWalk.mutateAsync({ dogId: dog.dogId, weather });
    setActiveWalk(walk);
    router.push('/walk/active');
  };

  return (
    <>
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {dog ? (
        <View style={styles.header}>
          <Pressable style={styles.headerMain} onPress={() => setDrawerVisible(true)}>
            <DogAvatar imageUri={dog.profileImageUrl} />
            <View>
              <Text style={styles.dogName}>{dog.name}</Text>
              <Text style={styles.dogBreed}>
                {dog.breed} · {calculateAge(dog.birthDate)}살
              </Text>
            </View>
          </Pressable>
          <Pressable style={styles.menuBtn} onPress={() => setDrawerVisible(true)}>
            <Text style={styles.menuBtnText}>☰</Text>
          </Pressable>
        </View>
      ) : null}

      <Card style={styles.statusCard}>
        <Text style={styles.statusText}>오늘은 아직 산책 전이에요</Text>
        <Text>🐾</Text>
      </Card>

      <Pressable style={styles.walkCta} onPress={handleStartWalk} disabled={!dog}>
        <Text style={styles.walkCtaEmoji}>🐾</Text>
        <Text style={styles.walkCtaLabel}>산책 시작</Text>
      </Pressable>

      <Text style={styles.sectionTitle}>최근 일기</Text>
      {sortedDiaries.length > 0 ? (
        sortedDiaries.map((diary) => (
          <Card
            key={diary.diaryId}
            style={styles.recentCard}
            onTouchEnd={() => router.push(`/diary/${diary.diaryId}`)}
          >
            <DiaryThumbnail
              diary={diary}
              pendingPhotosByWalkId={pendingPhotosByWalkId}
            />
            <View style={styles.recentBody}>
              <Text style={styles.recentDate}>{formatDate(diary.createdAt)}</Text>
              <Text style={styles.recentQuote} numberOfLines={1}>
                {diary.dailyQuote}
              </Text>
            </View>
          </Card>
        ))
      ) : (
        <Text style={styles.emptyText}>아직 작성된 일기가 없어요</Text>
      )}
    </ScrollView>

    <SettingsDrawer visible={drawerVisible} onClose={() => setDrawerVisible(false)} />
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md, paddingBottom: spacing.xl },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm + 2,
    marginBottom: spacing.md,
  },
  headerMain: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm + 2, flex: 1 },
  menuBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuBtnText: { fontSize: 16, color: colors.ink },
  dogName: { fontSize: 15, fontWeight: '800', color: colors.ink },
  dogBreed: { fontSize: 11, color: colors.grey },
  statusCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  statusText: { fontSize: 12, color: '#5b5b66' },
  walkCta: {
    width: 118,
    height: 118,
    borderRadius: 59,
    backgroundColor: colors.apricot,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: spacing.md,
    shadowColor: colors.apricot,
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.4,
    shadowRadius: 28,
    elevation: 6,
  },
  walkCtaEmoji: { fontSize: 24 },
  walkCtaLabel: { color: colors.white, fontWeight: '700', fontSize: 13, marginTop: spacing.xs },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.grey,
    marginBottom: spacing.sm,
  },
  recentCard: {
    flexDirection: 'row',
    gap: spacing.sm + 2,
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  recentBody: { flex: 1 },
  recentDate: { fontSize: 10, color: colors.grey, marginBottom: 2 },
  recentQuote: { fontSize: 12, fontWeight: '600', color: colors.ink },
  emptyText: { fontSize: 12, color: colors.grey },
});
