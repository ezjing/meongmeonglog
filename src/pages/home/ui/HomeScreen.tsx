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

import { DiaryListCard, useDiariesByDate, useRecentDiaries } from '@/entities/diary';
import type { DiaryListItem } from '@/entities/diary';
import { DogAvatar, useSelectedDog, useSelectedDogStore } from '@/entities/dog';
import { guardianTitleOrDefault } from '@/entities/guardian';
import { useActiveWalksForDogs, useWalkStore } from '@/entities/walk';
import { useConfirmLogout } from '@/features/auth';
import { SettingsDrawer } from '@/features/settings';
import {
  resumeWalkSession,
  useStartWalkSession,
  useWalkPartyPicker,
  walkStartFeedback,
} from '@/features/walk-session';
import {
  colors,
  spacing,
  radius,
  fontSize,
  fontWeight,
  opacity,
  shadows,
  scale,
  borderWidth,
} from '@/shared/config/theme';
import { formatDistance, calculateAge } from '@/shared/lib/formatDistance';
import { getLocalDateKey } from '@/shared/lib/localDate';
import { Card } from '@/shared/ui/Card';
import { ImagePreviewModal } from '@/shared/ui/ImagePreviewModal';
import { LoadingOverlay } from '@/shared/ui/LoadingOverlay';
import { useOverlay } from '@/shared/ui/overlay';
import { TabAppBar } from '@/shared/ui/TabAppBar';

import { WalkDogPickerSheet } from './WalkDogPickerSheet';

const WALK_CTA_SIZE = 118;
const EXIT_CONFIRM_WINDOW_MS = 2000;
const RECENT_DIARY_COUNT = 5;

function getTodayWalkStatus(
  activeWalk: ReturnType<typeof useWalkStore.getState>['activeWalk'],
  todayDiaries: DiaryListItem[],
  familyWalkerTitle: string | null,
) {
  if (activeWalk && !activeWalk.endedAt) {
    return {
      title: '산책 진행 중이에요',
      subtitle: '탭하면 이어서 기록할 수 있어요',
      emoji: '🐾',
      onPress: () => {
        resumeWalkSession();
        router.push('/walk/active');
      },
    };
  }

  if (familyWalkerTitle) {
    return {
      title: `${familyWalkerTitle}님이 산책 중이에요`,
      subtitle: null,
      emoji: '🐾',
      onPress: undefined,
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

export function HomeScreen() {
  const { dog, dogs = [], hydrated } = useSelectedDog();
  const todayKey = getLocalDateKey();
  const { data: todayDiaries = [] } = useDiariesByDate(todayKey, dog?.dogId);
  const { data: recentDiaries = [] } = useRecentDiaries(RECENT_DIARY_COUNT, dog?.dogId);
  const { start: startWalkSession, isStarting: isStartingWalk } = useStartWalkSession();
  const activeWalk = useWalkStore((s) => s.activeWalk);
  const selectedDogId = dog?.dogId;
  const { data: activeByFamily = [], refetch: refetchActiveWalks } = useActiveWalksForDogs(
    selectedDogId ? [selectedDogId] : [],
  );
  const pendingPhotosByWalkId = useWalkStore((s) => s.pendingWalkPhotosByWalkId);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const party = useWalkPartyPicker(dog, dogs);
  const confirmLogout = useConfirmLogout();
  const [profilePreviewVisible, setProfilePreviewVisible] = useState(false);
  const { showToast } = useOverlay();
  const lastBackPressRef = useRef(0);

  // 홈에 들어올 때마다 다른 가족의 진행 중 산책을 다시 확인한다
  useFocusEffect(
    useCallback(() => {
      if (!selectedDogId) return;
      void refetchActiveWalks();
    }, [refetchActiveWalks, selectedDogId]),
  );

  // 안드로이드: 홈에서 뒤로가기를 한 번 더 눌러야 종료
  useFocusEffect(
    useCallback(() => {
      if (Platform.OS !== 'android') return;

      const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
        const now = Date.now();
        if (now - lastBackPressRef.current < EXIT_CONFIRM_WINDOW_MS) return false;
        lastBackPressRef.current = now;
        showToast({
          message: '한 번 더 누르면 종료돼요',
          duration: EXIT_CONFIRM_WINDOW_MS,
          variant: 'warning',
        });
        return true;
      });
      return () => subscription.remove();
    }, [showToast]),
  );

  const openDiary = useCallback(
    (diary: DiaryListItem) => router.push(`/diary/${diary.diaryId}`),
    [],
  );
  const familyWalk = activeByFamily.find((row) => row.dogId === selectedDogId);
  const familyWalkerTitle = familyWalk ? guardianTitleOrDefault(familyWalk.recorderTitle) : null;
  const walkStatus = getTodayWalkStatus(activeWalk, todayDiaries, familyWalkerTitle);
  const showSwitcher = dogs.length > 1;

  const beginWalk = async (dogIds: string[]) => {
    const result = await startWalkSession(dogIds);
    if (result.status === 'started') {
      router.push('/walk/active');
      return;
    }
    const feedback = walkStartFeedback(result);
    if (feedback) showToast(feedback);
  };

  const handleStartWalk = () => {
    party.beginSelection((dogIds) => {
      void beginWalk(dogIds);
    });
  };

  return (
    <>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {dog && (dogs.length <= 1 || hydrated) && showSwitcher ? (
          <>
            {/* 메뉴 버튼이 아바타 줄과 같은 높이에 오도록 앱바에는 아바타 줄만 넣는다 */}
            <TabAppBar onMenuPress={() => setDrawerVisible(true)} style={styles.switcherBar}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.avatarRow}
              >
                {dogs.map((item) => {
                  const selected = item.dogId === dog.dogId;
                  return (
                    <Pressable
                      key={item.dogId}
                      onPress={() => useSelectedDogStore.getState().setSelectedDogId(item.dogId)}
                      accessibilityRole="button"
                      accessibilityLabel={item.name}
                      accessibilityState={{ selected }}
                    >
                      <DogAvatar
                        imageUri={item.profileImageUrl}
                        style={selected ? styles.avatarSelected : styles.avatarIdle}
                      />
                    </Pressable>
                  );
                })}
              </ScrollView>
            </TabAppBar>
            <View style={styles.switcherInfo}>
              <Text style={styles.dogName}>{dog.name}</Text>
              <Text style={styles.dogBreed}>
                {dog.breed} · {calculateAge(dog.birthDate)}살
              </Text>
            </View>
          </>
        ) : dog && (dogs.length <= 1 || hydrated) ? (
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
        ) : dogs.length > 1 ? (
          <TabAppBar onMenuPress={() => setDrawerVisible(true)} />
        ) : null}

        <Pressable onPress={walkStatus.onPress}>
          <Card style={styles.statusCard}>
            <View style={styles.statusBody}>
              <Text style={styles.statusText}>{walkStatus.title}</Text>
              {walkStatus.subtitle ? (
                <Text style={styles.statusSubtext}>{walkStatus.subtitle}</Text>
              ) : null}
            </View>
            <Text>{walkStatus.emoji}</Text>
          </Card>
        </Pressable>

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
            <DiaryListCard
              key={diary.diaryId}
              diary={diary}
              pendingPhotosByWalkId={pendingPhotosByWalkId}
              onPress={openDiary}
              style={styles.recentCard}
            />
          ))
        ) : (
          <Text style={styles.emptyText}>아직 작성된 일기가 없어요</Text>
        )}
      </ScrollView>

      <SettingsDrawer
        visible={drawerVisible}
        onClose={() => setDrawerVisible(false)}
        onLogout={confirmLogout}
      />
      <ImagePreviewModal
        visible={profilePreviewVisible}
        imageUri={dog?.profileImageUrl}
        onClose={() => setProfilePreviewVisible(false)}
      />
      <WalkDogPickerSheet
        visible={party.pickerVisible}
        dogs={party.partyDogs}
        checkedDogIds={party.checkedDogIds}
        onToggle={party.toggleDog}
        onStart={() => party.confirmParty((dogIds) => void beginWalk(dogIds))}
        onClose={party.closePicker}
      />
      <Modal visible={isStartingWalk} transparent animationType="fade" statusBarTranslucent>
        <LoadingOverlay title="산책 준비 중이에요" subtitle="위치와 날씨를 확인하고 있어요" />
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.md, paddingBottom: spacing.xl },
  headerMain: { flexDirection: 'row', alignItems: 'center', gap: spacing.ms },
  // 아바타 줄 → 이름 → 견종 간격은 예전 한 덩어리일 때(sm)와 같게, 아래 카드까지는 앱바 기본(md)
  switcherBar: { marginBottom: spacing.sm },
  switcherInfo: { gap: spacing.sm, marginBottom: spacing.md },
  avatarRow: { gap: spacing.sm, paddingVertical: spacing.xxs },
  avatarSelected: { borderWidth: borderWidth.thick, borderColor: colors.primaryFg },
  avatarIdle: { borderWidth: borderWidth.thick, borderColor: colors.bg },
  dogName: { fontSize: fontSize.lg, fontWeight: fontWeight.extrabold, color: colors.fg },
  dogBreed: { fontSize: fontSize.sm, color: colors.fgMuted },
  statusCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  statusBody: { flex: 1, marginRight: spacing.sm },
  statusText: { fontSize: fontSize.md, color: colors.fgSecondary },
  statusSubtext: { fontSize: fontSize.sm, color: colors.fgMuted, marginTop: spacing.xxs },
  walkCta: {
    width: WALK_CTA_SIZE,
    height: WALK_CTA_SIZE,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: spacing.md,
    ...shadows.cta,
  },
  walkCtaPressed: { opacity: opacity.pressed, transform: [{ scale: scale.pressed }] },
  walkCtaEmoji: { fontSize: fontSize.displayLg },
  walkCtaLabel: {
    color: colors.fgOnPrimary,
    fontWeight: fontWeight.bold,
    fontSize: fontSize.base,
    marginTop: spacing.xs,
  },
  sectionTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.fgMuted,
    marginBottom: spacing.sm,
  },
  recentCard: { marginBottom: spacing.sm },
  emptyText: { fontSize: fontSize.md, color: colors.fgMuted },
});
