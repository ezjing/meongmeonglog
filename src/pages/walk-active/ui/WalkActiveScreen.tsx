import { router } from 'expo-router';
import { useCallback, useEffect, useRef } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useWalkStore } from '@/entities/walk';
import {
  WalkMap,
  useAbandonWalk,
  useWalkTracker,
  freezeWalkSession,
} from '@/features/walk-session';
import { colors, spacing, radius, fontSize, fontWeight } from '@/shared/config/theme';
import { formatDistance, formatDuration } from '@/shared/lib/formatDistance';
import { useBackConfirmAction } from '@/shared/lib/useBackConfirmAction';
import { Button } from '@/shared/ui/Button';
import { useOverlay } from '@/shared/ui/overlay/index';

export function WalkActiveScreen() {
  const { activeWalk, elapsedSec, distanceMeter, trackingError } = useWalkTracker();
  const walkPath = useWalkStore((s) => s.walkPath);
  const { showAlert, showToast } = useOverlay();
  const { abandonWalk, isAbandoning } = useAbandonWalk();
  const allowLeaveRef = useRef<(() => void) | null>(null);

  const handleCancelPress = useCallback(async () => {
    if (!activeWalk) return;

    const confirmed = await showAlert({
      icon: '🐾',
      title: '산책을 취소할까요?',
      message: '지금까지 기록한 이동 거리와 시간은 저장되지 않아요.',
      cancelLabel: '계속하기',
      confirmLabel: '취소하기',
      destructive: true,
    });
    if (!confirmed) return;

    try {
      await abandonWalk(activeWalk.walkId);
      allowLeaveRef.current?.();
      router.dismissTo('/(tabs)');
    } catch {
      showToast({
        message: '산책 취소에 실패했어요. 잠시 후 다시 시도해 주세요.',
        variant: 'error',
      });
    }
  }, [abandonWalk, activeWalk, showAlert, showToast]);

  const { allowLeave } = useBackConfirmAction(handleCancelPress, !!activeWalk);

  useEffect(() => {
    allowLeaveRef.current = allowLeave;
  }, [allowLeave]);

  useEffect(() => {
    if (!trackingError) return;
    showToast({
      message: trackingError,
      variant: 'warning',
    });
  }, [trackingError, showToast]);

  const weatherIcon = activeWalk?.weatherIcon ?? '🌡️';
  const weatherLabel =
    activeWalk?.weatherTemp != null
      ? `${activeWalk.weatherCondition ?? '날씨'} ${activeWalk.weatherTemp}°C`
      : '날씨 조회 중…';

  const handleFinishPress = async () => {
    const confirmed = await showAlert({
      icon: '🐾',
      title: '산책을 종료할까요?',
      message: '지금까지 기록한 이동 거리와 시간이 저장돼요. 사진과 특이사항을 입력하러 갈게요.',
      cancelLabel: '취소',
      confirmLabel: '종료하기',
    });
    if (confirmed) {
      await freezeWalkSession();
      allowLeave();
      router.push('/walk/finish');
    }
  };

  if (!activeWalk) {
    return (
      <View style={styles.center}>
        <Text style={styles.empty}>진행 중인 산책이 없습니다</Text>
        <Button label="홈으로" onPress={() => router.dismissTo('/(tabs)')} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.mapWrap}>
        <WalkMap routePath={walkPath} />
        <View style={styles.weatherBadge}>
          <Text style={styles.weatherText}>
            {weatherIcon} {activeWalk.weatherTemp != null ? `${activeWalk.weatherTemp}°C` : '…'}
          </Text>
        </View>
      </View>

      <View style={styles.stats}>
        <Text style={styles.timerLabel}>경과 시간</Text>
        <Text style={styles.timer}>{formatDuration(elapsedSec)}</Text>
        <View style={styles.statPair}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{formatDistance(distanceMeter)}</Text>
            <Text style={styles.statLabel}>이동 거리</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{weatherLabel}</Text>
            <Text style={styles.statLabel}>현재 날씨</Text>
          </View>
        </View>
      </View>

      <View style={styles.actions}>
        <Button
          label="산책 취소"
          variant="danger"
          onPress={handleCancelPress}
          disabled={isAbandoning}
          style={styles.cancelBtn}
        />
        <Button
          label="산책 종료"
          variant="primary"
          onPress={handleFinishPress}
          style={styles.finishBtn}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  empty: { color: colors.fgMuted, marginBottom: spacing.md },
  mapWrap: { height: '50%', position: 'relative' },
  weatherBadge: {
    position: 'absolute',
    top: spacing.ms,
    left: spacing.ms,
    backgroundColor: colors.surface,
    borderRadius: radius.full,
    paddingHorizontal: spacing.ms,
    paddingVertical: spacing.xs,
  },
  weatherText: { fontSize: fontSize.xs, fontWeight: fontWeight.bold },
  stats: { padding: spacing.md },
  timerLabel: { textAlign: 'center', fontSize: fontSize.sm, color: colors.fgMuted },
  timer: {
    textAlign: 'center',
    fontSize: fontSize.hero,
    fontWeight: fontWeight.bold,
    color: colors.fg,
    marginVertical: spacing.xs,
  },
  statPair: { flexDirection: 'row', justifyContent: 'center', gap: spacing.lg },
  statItem: { alignItems: 'center' },
  statValue: { fontSize: fontSize.base, fontWeight: fontWeight.bold, color: colors.fg },
  statLabel: { fontSize: fontSize.xs, color: colors.fgMuted },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
    padding: spacing.md,
    marginTop: 'auto',
  },
  cancelBtn: { flexShrink: 0 },
  finishBtn: { flex: 1 },
});
