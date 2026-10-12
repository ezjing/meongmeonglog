import { router, useFocusEffect } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import {
  BackHandler,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { DiaryThumbnail } from '@/components/diary/DiaryThumbnail';
import { DogAvatar } from '@/components/dog/DogAvatar';
import { SettingsDrawer } from '@/components/settings/SettingsDrawer';
import { Card } from '@/components/ui/Card';
import { ImagePreviewModal } from '@/components/ui/ImagePreviewModal';
import { LoadingOverlay } from '@/components/ui/LoadingOverlay';
import { useOverlay } from '@/components/ui/overlay';
import { TabAppBar } from '@/components/ui/TabAppBar';
import {
  colors,
  spacing,
  radius,
  fontSize,
  fontWeight,
  opacity,
  shadows,
  scale,
} from '@/constants/theme';
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
import { getLocalDateKey } from '@/lib/utils/localDate';
import { useWalkStore } from '@/stores/walkStore';
import type { DiaryListItem } from '@/types/domain';

const WALK_CTA_SIZE = 118;
const EXIT_CONFIRM_WINDOW_MS = 2000;

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
  const [isStartingWalk, setIsStartingWalk] = useState(false);
  const startingWalkRef = useRef(false);
  const { showToast } = useOverlay();
  const lastBackPressRef = useRef(0);

  // 안드로이드: 홈에서 뒤로가기를 한 번 더 눌러야 종료
  useFocusEffect(
    useCallback(() => {
      const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
        const now = Date.now();
        if (now - lastBackPressRef.current < EXIT_CONFIRM_WINDOW_MS) return false;
        lastBackPressRef.current = now;
        showToast({ message: '한 번 더 누르면 종료돼요', duration: EXIT_CONFIRM_WINDOW_MS });
        return true;
      });
      return () => subscription.remove();
    }, [showToast]),
  );

  const dog = dogs?.[0];
  const sortedDiaries = [...(diaries ?? [])].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
  const todayDiaries = sortedDiaries.filter(isDiaryToday);
  const recentDiaries = sortedDiaries.slice(0, 5);
  const walkStatus = getTodayWalkStatus(activeWalk, todayDiaries);

  const handleStartWalk = async () => {
    if (!dog || startingWalkRef.current) return;

    startingWalkRef.current = true;
    setIsStartingWalk(true);
    try {
      await runStartWalk(dog.dogId);
    } finally {
      startingWalkRef.current = false;
      setIsStartingWalk(false);
    }
  };

  const runStartWalk = async (dogId: string) => {
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

    try {
      const walk = await startWalk.mutateAsync({ dogId, weather });
      setActiveWalk(walk);
      router.push('/walk/active');
    } catch {
      showToast({ message: '⚠️ 산책을 시작하지 못했어요. 다시 시도해주세요.', variant: 'warning' });
    }
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

        <Pressable
          style={({ pressed }) => [styles.walkCta, pressed && styles.walkCtaPressed]}
          onPress={handleStartWalk}
          disabled={!dog || isStartingWalk}
          accessibilityRole="button"
          accessibilityState={{ busy: isStartingWalk, disabled: !dog || isStartingWalk }}
        >
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
      <Modal visible={isStartingWalk} transparent animationType="fade" statusBarTranslucent>
        <LoadingOverlay title="산책 준비 중이에요" subtitle="위치와 날씨를 확인하고 있어요" />
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md, paddingBottom: spacing.xl },
  headerMain: { flexDirection: 'row', alignItems: 'center', gap: spacing.ms },
  dogName: { fontSize: fontSize.lg, fontWeight: fontWeight.extrabold, color: colors.ink },
  dogBreed: { fontSize: fontSize.sm, color: colors.grey },
  statusCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  statusBody: { flex: 1, marginRight: spacing.sm },
  statusText: { fontSize: fontSize.md, color: colors.inkSoft },
  statusSubtext: { fontSize: fontSize.sm, color: colors.grey, marginTop: spacing.xxs },
  walkCta: {
    width: WALK_CTA_SIZE,
    height: WALK_CTA_SIZE,
    borderRadius: radius.full,
    backgroundColor: colors.apricot,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: spacing.md,
    ...shadows.cta,
  },
  walkCtaPressed: { opacity: opacity.pressed, transform: [{ scale: scale.pressed }] },
  walkCtaEmoji: { fontSize: fontSize.displayLg },
  walkCtaLabel: {
    color: colors.white,
    fontWeight: fontWeight.bold,
    fontSize: fontSize.base,
    marginTop: spacing.xs,
  },
  sectionTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.grey,
    marginBottom: spacing.sm,
  },
  recentCard: {
    flexDirection: 'row',
    gap: spacing.ms,
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  recentBody: { flex: 1 },
  recentDate: { fontSize: fontSize.xs, color: colors.grey, marginBottom: spacing.xxs },
  recentQuote: { fontSize: fontSize.md, fontWeight: fontWeight.semibold, color: colors.ink },
  emptyText: { fontSize: fontSize.md, color: colors.grey },
});
