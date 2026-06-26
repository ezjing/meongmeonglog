import { router } from "expo-router";
import { useRef } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import MapView, { Polyline, type Region } from "react-native-maps";

import { Button } from "@/components/ui/Button";
import { colors, spacing } from "@/constants/theme";
import { useWalkTracker } from "@/hooks/useWalkTracker";
import { formatDistance, formatDuration } from "@/lib/utils/formatDistance";
import { useWalkStore } from "@/stores/walkStore";

const DEFAULT_REGION: Region = {
  latitude: 37.5665,
  longitude: 126.978,
  latitudeDelta: 0.01,
  longitudeDelta: 0.01,
};

export default function WalkActiveScreen() {
  const { activeWalk, isPaused, elapsedSec, distanceMeter } = useWalkTracker();
  const setPaused = useWalkStore((s) => s.setPaused);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const weatherLabel = activeWalk?.weatherIcon
    ? `${activeWalk.weatherCondition ?? "맑음"} ${activeWalk.weatherTemp ?? 23}°C`
    : "맑음 23°C";

  const handleFinishPressIn = () => {
    longPressTimer.current = setTimeout(() => {
      router.push("/walk/finish");
    }, 800);
  };

  const handleFinishPressOut = () => {
    if (longPressTimer.current) clearTimeout(longPressTimer.current);
  };

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
        <MapView
          style={styles.map}
          initialRegion={DEFAULT_REGION}
          showsUserLocation
        >
          <Polyline
            coordinates={[{ latitude: 37.5665, longitude: 126.978 }]}
            strokeColor={colors.apricot}
            strokeWidth={3}
          />
        </MapView>
        <View style={styles.weatherBadge}>
          <Text style={styles.weatherText}>
            ☀️ {activeWalk.weatherTemp ?? 23}°C
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
          label={isPaused ? "▶" : "⏸"}
          variant="outline"
          onPress={() => setPaused(!isPaused)}
          style={styles.pauseBtn}
        />
        <Pressable
          onPressIn={handleFinishPressIn}
          onPressOut={handleFinishPressOut}
          style={styles.finishBtn}
        >
          <Text style={styles.finishText}>길게 눌러 산책 종료</Text>
        </Pressable>
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
  mapWrap: { height: 230, position: "relative" },
  map: { flex: 1 },
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
  pauseBtn: { width: 52 },
  finishBtn: {
    flex: 1,
    backgroundColor: colors.apricot,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.md - 3,
  },
  finishText: { color: colors.white, fontWeight: "700", fontSize: 14 },
});
