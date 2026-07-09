import { router } from 'expo-router';
import { useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { DiaryThumbnail } from '@/components/diary/DiaryThumbnail';
import { DogAvatar } from '@/components/dog/DogAvatar';
import { SettingsDrawer } from '@/components/settings/SettingsDrawer';
import { Card } from '@/components/ui/Card';
import { ImagePreviewModal } from '@/components/ui/ImagePreviewModal';
import { useOverlay } from '@/components/ui/overlay';
import { TabAppBar } from '@/components/ui/TabAppBar';
import { colors, spacing } from '@/constants/theme';
import { useDogs } from '@/hooks/useAuthSession';
import { useDiaryList } from '@/hooks/useDiaries';
import { useStartWalk } from '@/hooks/useWalkMutations';
import {
  getCurrentCoordinates,
  requestLocationPermission,
  stopWalkTracking,
} from '@/hooks/useWalkTracker';
import { fetchCurrentWeather } from '@/lib/api/weatherApi';
import { formatDate, formatDistance, calculateAge } from '@/lib/utils/formatDistance';
import { useWalkStore } from '@/stores/walkStore';
import type { DiaryListItem } from '@/types/domain';

function getLocalDateKey(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function isDiaryToday(diary: DiaryListItem) {
  const created = new Date(diary.createdAt);
  return getLocalDateKey(created) === getLocalDateKey();
}

function getTodayWalkStatus(
  activeWalk: ReturnType<typeof useWalkStore.getState>['activeWalk'],
  todayDiaries: DiaryListItem[],
) {
  if (activeWalk && !activeWalk.endedAt) {
    return {
      title: '산책 진행 중이에요',
      subtitle: '탭하면 이어서 기록할 수 있어요',
      emoji: '🐾',
      onPress: () => router.push('/walk/active'),
    };
  }

  const count = todayDiaries.length;
  const totalDistance = todayDiaries.reduce((sum, diary) => sum + (diary.distanceMeter ?? 0), 0);

  if (count === 0) {
    return {
      title: '오늘은 아직 산책 전이에요',
      subtitle: null,
      emoji: '🐾',
      onPress: undefined,
    };
  }

  const title = count === 1 ? '오늘 산책 1번 다녀왔어요' : `오늘 산책 ${count}번 다녀왔어요`;
  const subtitle = totalDistance > 0 ? `총 ${formatDistance(totalDistance)} 걸었어요` : null;

  return { title, subtitle, emoji: '✨', onPress: undefined };
}

export default function HomeScreen() {
  const { data: dogs } = useDogs();
  const { data: diaries } = useDiaryList();
  const startWalk = useStartWalk();
  const setActiveWalk = useWalkStore((s) => s.setActiveWalk);
  const resetWalk = useWalkStore((s) => s.reset);
  const activeWalk = useWalkStore((s) => s.activeWalk);
  const pendingPhotosByWalkId = useWalkStore((s) => s.pendingWalkPhotosByWalkId);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [profilePreviewVisible, setProfilePreviewVisible] = useState(false);
  const { showToast } = useOverlay();

  const dog = dogs?.[0];
  const sortedDiaries = [...(diaries ?? [])].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
  const todayDiaries = sortedDiaries.filter(isDiaryToday);
  const recentDiaries = sortedDiaries.slice(0, 5);
  const walkStatus = getTodayWalkStatus(activeWalk, todayDiaries);

  const handleStartWalk = async () => {
    if (!dog) return;

    const granted = await requestLocationPermission();
    if (!granted) {
      showToast({
        message:
          Platform.OS === 'ios'
            ? '⚠️ 산책 기록을 위해 위치 "항상 허용"이 필요해요. 설정에서 권한을 확인해 주세요.'
            : '⚠️ 산책 기록을 위해 위치(앱 사용 중)와 알림 권한을 허용해 주세요.',
        variant: 'warning',
      });
      return;
    }

    await stopWalkTracking();
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
          <TabAppBar onMenuPress={() => setDrawerVisible(true)}>
            <View style={styles.headerMain}>
              <Pressable onPress={() => setProfilePreviewVisible(true)}>
                <DogAvatar imageUri={dog.profileImageUrl} />
              </Pressable>
              <View>
                <Text style={styles.dogName}>{dog.name}</Text>
                <Text style={styles.dogBreed}>
                  {dog.breed} · {calculateAge(dog.birthDate)}살
                </Text>
              </View>
            </View>
          </TabAppBar>
        ) : null}

        <Card style={styles.statusCard} onTouchEnd={walkStatus.onPress}>
          <View style={styles.statusBody}>
            <Text style={styles.statusText}>{walkStatus.title}</Text>
            {walkStatus.subtitle ? (
              <Text style={styles.statusSubtext}>{walkStatus.subtitle}</Text>
            ) : null}
          </View>
          <Text>{walkStatus.emoji}</Text>
        </Card>

        <Pressable style={styles.walkCta} onPress={handleStartWalk} disabled={!dog}>
          <Text style={styles.walkCtaEmoji}>🐾</Text>
          <Text style={styles.walkCtaLabel}>산책 시작</Text>
        </Pressable>

        <Text style={styles.sectionTitle}>최근 일기</Text>
        {recentDiaries.length > 0 ? (
          recentDiaries.map((diary) => (
            <Card
              key={diary.diaryId}
              style={styles.recentCard}
              onTouchEnd={() => router.push(`/diary/${diary.diaryId}`)}
            >
              <DiaryThumbnail diary={diary} pendingPhotosByWalkId={pendingPhotosByWalkId} />
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
      <ImagePreviewModal
        visible={profilePreviewVisible}
        imageUri={dog?.profileImageUrl}
        onClose={() => setProfilePreviewVisible(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md, paddingBottom: spacing.xl },
  headerMain: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm + 2 },
  dogName: { fontSize: 15, fontWeight: '800', color: colors.ink },
  dogBreed: { fontSize: 11, color: colors.grey },
  statusCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  statusBody: { flex: 1, marginRight: spacing.sm },
  statusText: { fontSize: 12, color: '#5b5b66' },
  statusSubtext: { fontSize: 11, color: colors.grey, marginTop: 2 },
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
