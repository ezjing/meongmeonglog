import { router } from "expo-router";
import { useRef } from "react";
import { StyleSheet, Text, View } from "react-native";

import { WalkMap } from "@/components/walk/WalkMap";
import { Button } from "@/components/ui/Button";
import { useOverlay } from "@/components/ui/overlay";
import { colors, spacing } from "@/constants/theme";
import { useBackConfirmAction } from "@/hooks/useBackConfirmAction";
import { useCancelWalk } from "@/hooks/useWalkMutations";
import { stopWalkTracking, useWalkTracker, freezeWalkSession } from "@/hooks/useWalkTracker";
import { formatDistance, formatDuration } from "@/lib/utils/formatDistance";
import { useWalkStore } from "@/stores/walkStore";

export default function WalkActiveScreen() {
  const { activeWalk, elapsedSec, distanceMeter } = useWalkTracker();
  const walkPath = useWalkStore((s) => s.walkPath);
  const reset = useWalkStore((s) => s.reset);
  const { showAlert, showToast } = useOverlay();
  const cancelWalk = useCancelWalk();
  const backHandlerRef = useRef<() => void | Promise<void>>(() => {});

  const { allowLeave } = useBackConfirmAction(
    () => backHandlerRef.current(),
    !!activeWalk,
  );

  const weatherIcon = activeWalk?.weatherIcon ?? "🌡️";
  const weatherLabel =
    activeWalk?.weatherTemp != null
      ? `${activeWalk.weatherCondition ?? "날씨"} ${activeWalk.weatherTemp}°C`
      : "날씨 조회 중…";

  const handleFinishPress = async () => {
    const confirmed = await showAlert({
      icon: "🐾",
      title: "산책을 종료할까요?",
      message:
        "지금까지 기록한 이동 거리와 시간이 저장돼요. 사진과 특이사항을 입력하러 갈게요.",
      cancelLabel: "취소",
      confirmLabel: "종료하기",
    });
    if (confirmed) {
      await freezeWalkSession();
      allowLeave();
      router.push("/walk/finish");
    }
  };

  const handleCancelPress = async () => {
    if (!activeWalk) return;

    const confirmed = await showAlert({
      icon: "🐾",
      title: "산책을 취소할까요?",
      message: "지금까지 기록한 이동 거리와 시간은 저장되지 않아요.",
      cancelLabel: "계속하기",
      confirmLabel: "취소하기",
      destructive: true,
    });
    if (!confirmed) return;

    try {
      await cancelWalk.mutateAsync(activeWalk.walkId);
      await stopWalkTracking();
      reset();
      allowLeave();
      router.replace("/(tabs)");
    } catch {
      showToast({
        message: "⚠️ 산책 취소에 실패했어요. 잠시 후 다시 시도해 주세요.",
        variant: "warning",
      });
    }
  };

  backHandlerRef.current = handleCancelPress;

  if (!activeWalk) {
    return (
      <View style={styles.center}>
        <Text style={styles.empty}>진행 중인 산책이 없습니다</Text>
        <Button label="홈으로" onPress={() => router.replace("/(tabs)")} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.mapWrap}>
        <WalkMap routePath={walkPath} />
        <View style={styles.weatherBadge}>
          <Text style={styles.weatherText}>
            {weatherIcon}{" "}
            {activeWalk.weatherTemp != null ? `${activeWalk.weatherTemp}°C` : "…"}
          </Text>
        </View>
      </View>

      <View style={styles.stats}>
        <Text style={styles.timerLabel}>경과 시간</Text>
        <Text style={styles.timer}>{formatDuration(elapsedSec)}</Text>
        <View style={styles.statPair}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>
              {formatDistance(distanceMeter)}
            </Text>
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
          variant="soft"
          onPress={handleCancelPress}
          disabled={cancelWalk.isPending}
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
  container: { flex: 1, backgroundColor: colors.background },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.lg,
  },
  empty: { color: colors.grey, marginBottom: spacing.md },
  mapWrap: { height: "50%", position: "relative" },
  weatherBadge: {
    position: "absolute",
    top: spacing.sm + 2,
    left: spacing.sm + 2,
    backgroundColor: colors.white,
    borderRadius: 999,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.xs,
  },
  weatherText: { fontSize: 10, fontWeight: "700" },
  stats: { padding: spacing.md },
  timerLabel: { textAlign: "center", fontSize: 11, color: colors.grey },
  timer: {
    textAlign: "center",
    fontSize: 34,
    fontWeight: "700",
    color: colors.ink,
    marginVertical: spacing.xs,
  },
  statPair: { flexDirection: "row", justifyContent: "center", gap: spacing.lg },
  statItem: { alignItems: "center" },
  statValue: { fontSize: 14, fontWeight: "700", color: colors.ink },
  statLabel: { fontSize: 10, color: colors.grey },
  actions: {
    flexDirection: "row",
    gap: spacing.sm,
    padding: spacing.md,
    marginTop: "auto",
  },
  cancelBtn: { flexShrink: 0 },
  finishBtn: { flex: 1 },
});
