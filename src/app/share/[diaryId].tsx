import { router, useLocalSearchParams } from "expo-router";
import * as Sharing from "expo-sharing";
import type { ComponentRef } from "react";
import { useEffect, useRef, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import ViewShot from "react-native-view-shot";

import { Button } from "@/components/ui/Button";
import { useOverlay } from "@/components/ui/overlay";
import { QuoteCard } from "@/components/ui/ScreenContainer";
import { colors, radius, spacing } from "@/constants/theme";
import { useDiary, useShareCard } from "@/hooks/useDiaries";
import { formatDate } from "@/lib/utils/formatDistance";

export default function ShareScreen() {
  const { diaryId } = useLocalSearchParams<{ diaryId: string }>();
  const { data: diary } = useDiary(diaryId ?? "");
  const shareCard = useShareCard();
  const { showToast } = useOverlay();
  const viewShotRef = useRef<ComponentRef<typeof ViewShot>>(null);
  const [remoteUrl, setRemoteUrl] = useState<string | null>(null);

  useEffect(() => {
    if (diaryId) {
      shareCard
        .mutateAsync(diaryId)
        .then(setRemoteUrl)
        .catch(() => {});
    }
  }, [diaryId]);

  const handleSaveAndShare = async () => {
    try {
      if (viewShotRef.current?.capture) {
        const uri = await viewShotRef.current.capture();
        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(uri);
        } else {
          showToast({ message: "📶 이 기기에서는 공유 기능을 사용할 수 없어요", variant: "default" });
        }
      }
    } catch {
      showToast({ message: "⚠️ 이미지 저장에 실패했어요", variant: "warning" });
    }
  };

  if (!diary) {
    return (
      <View style={styles.center}>
        <Text style={styles.loading}>불러오는 중...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>공유 카드 미리보기</Text>

      <ViewShot ref={viewShotRef} options={{ format: "png", quality: 1 }}>
        <View style={styles.card}>
          <View style={styles.cardPhoto}>
            <Text style={styles.tag}>
              🐾 {diary.dogName ?? "코코"} · {formatDate(diary.createdAt)}
            </Text>
          </View>
          <View style={styles.cardBody}>
            <Text style={styles.summary} numberOfLines={3}>
              {diary.content}
            </Text>
            <QuoteCard quote={diary.dailyQuote} />
          </View>
        </View>
      </ViewShot>

      {remoteUrl ? (
        <Text style={styles.remoteHint}>서버 카드 URL 생성됨</Text>
      ) : null}

      <Text style={styles.sectionLabel}>공유하기</Text>
      <Button
        label="💬  카카오톡 공유"
        variant="kakao"
        onPress={handleSaveAndShare}
        style={styles.shareBtn}
      />
      <Button
        label="📷  인스타그램 공유"
        onPress={handleSaveAndShare}
        style={styles.instaBtn}
      />
      <Button
        label="⬇️  이미지 저장 후 공유"
        variant="soft"
        onPress={handleSaveAndShare}
        style={styles.shareBtn}
      />

      <Button
        label="완료"
        variant="outline"
        onPress={() => router.replace("/(tabs)")}
        style={styles.done}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md, paddingBottom: spacing.xl },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  loading: { color: colors.grey },
  title: {
    fontSize: 15,
    fontWeight: "800",
    color: colors.ink,
    marginBottom: spacing.md,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    overflow: "hidden",
    marginBottom: spacing.md,
    shadowColor: colors.ink,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 4,
  },
  cardPhoto: {
    height: 150,
    backgroundColor: colors.apricot,
    justifyContent: "flex-end",
    padding: spacing.sm + 2,
  },
  tag: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(0,0,0,0.35)",
    color: colors.white,
    fontSize: 10,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.xs,
    borderRadius: 999,
    overflow: "hidden",
  },
  cardBody: { padding: spacing.md - 4 },
  summary: {
    fontSize: 12,
    lineHeight: 20,
    color: colors.ink,
    marginBottom: spacing.sm,
  },
  remoteHint: { fontSize: 10, color: colors.grey, marginBottom: spacing.sm },
  sectionLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.grey,
    marginBottom: spacing.sm,
  },
  shareBtn: { marginBottom: spacing.sm },
  instaBtn: { backgroundColor: "#E1306C" },
  done: { marginTop: spacing.sm },
});
