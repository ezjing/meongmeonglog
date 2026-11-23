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
import { DogAvatar, orderWalkDogs, useSelectedDog, useSelectedDogStore } from '@/entities/dog';
import { getWalkDogIds, useWalkStore } from '@/entities/walk';
import { useConfirmLogout } from '@/features/auth';
import { SettingsDrawer } from '@/features/settings';
import { resumeWalkSession, useStartWalkSession } from '@/features/walk-session';
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
  const pendingPhotosByWalkId = useWalkStore((s) => s.pendingWalkPhotosByWalkId);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [pickerVisible, setPickerVisible] = useState(false);
  const [checkedDogIds, setCheckedDogIds] = useState<string[]>([]);
  const confirmLogout = useConfirmLogout();
  const [profilePreviewVisible, setProfilePreviewVisible] = useState(false);
  const { showToast } = useOverlay();
  const lastBackPressRef = useRef(0);

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
  const walkForDog =
    activeWalk && dog && getWalkDogIds(activeWalk).includes(dog.dogId) ? activeWalk : null;
  const walkStatus = getTodayWalkStatus(walkForDog, todayDiaries);
  const showSwitcher = dogs.length > 1;

  const beginWalk = async (dogIds: string[]) => {
    const result = await startWalkSession(dogIds);
    if (result === 'started') {
      router.push('/walk/active');
    } else if (result === 'permission_denied') {
      showToast({
        message:
          Platform.OS === 'ios'
            ? '산책 기록을 위해 위치 "항상 허용"이 필요해요. 설정에서 권한을 확인해 주세요.'
            : Platform.OS === 'web'
              ? '산책 기록을 위해 위치 권한을 허용해 주세요.'
              : '산책 기록을 위해 위치(앱 사용 중)와 알림 권한을 허용해 주세요.',
        variant: 'warning',
      });
    } else if (result === 'failed') {
      showToast({ message: '산책을 시작하지 못했어요. 다시 시도해주세요.', variant: 'error' });
    }
  };

  const handleStartWalk = () => {
    if (!dog) return;
    if (dogs.length <= 1) {
      void beginWalk([dog.dogId]);
      return;
    }
    setCheckedDogIds([dog.dogId]);
    setPickerVisible(true);
  };

  const handleToggleDog = (dogId: string) => {
    setCheckedDogIds((current) =>
      current.includes(dogId) ? current.filter((id) => id !== dogId) : [...current, dogId],
    );
  };

  const handleConfirmParty = () => {
    if (!dog) return;
    if (checkedDogIds.length === 0) {
      showToast({
        message: '함께 산책할 강아지를 골라 주세요',
        variant: 'warning',
      });
      return;
    }
    const ordered = orderWalkDogs(
      dogs.filter((item) => checkedDogIds.includes(item.dogId)),
      dog.dogId,
    ).map((item) => item.dogId);
    setPickerVisible(false);
    void beginWalk(ordered);
  };

  return (
    <>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {dog && (dogs.length <= 1 || hydrated) ? (
          <TabAppBar onMenuPress={() => setDrawerVisible(true)}>
            {showSwitcher ? (
              <View style={styles.switcher}>
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
                <Text style={styles.dogName}>{dog.name}</Text>
                <Text style={styles.dogBreed}>
                  {dog.breed} · {calculateAge(dog.birthDate)}살
                </Text>
              </View>
            ) : (
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
            )}
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
        visible={pickerVisible}
        dogs={dogs}
        checkedDogIds={checkedDogIds}
        onToggle={handleToggleDog}
        onStart={handleConfirmParty}
        onClose={() => setPickerVisible(false)}
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
  switcher: { gap: spacing.sm },
  avatarRow: { gap: spacing.sm, paddingVertical: spacing.xxs },
  avatarSelected: { borderWidth: borderWidth.thick, borderColor: colors.primary },
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
