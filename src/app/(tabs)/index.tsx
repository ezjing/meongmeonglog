import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Card } from '@/components/ui/Card';
import { useDogs } from '@/hooks/useAuthSession';
import { useDiaryList } from '@/hooks/useDiaries';
import { useStartWalk } from '@/hooks/useWalkMutations';
import { requestLocationPermission } from '@/hooks/useWalkTracker';
import { formatDate } from '@/lib/utils/formatDistance';
import { calculateAge } from '@/lib/utils/formatDistance';
import { colors, radius, spacing } from '@/constants/theme';
import { useWalkStore } from '@/stores/walkStore';

export default function HomeScreen() {
  const { data: dogs } = useDogs();
  const { data: diaries } = useDiaryList();
  const startWalk = useStartWalk();
  const setActiveWalk = useWalkStore((s) => s.setActiveWalk);
  const resetWalk = useWalkStore((s) => s.reset);

  const dog = dogs?.[0];
  const recentDiary = diaries?.[0];

  const handleStartWalk = async () => {
    if (!dog) return;
    await requestLocationPermission();
    resetWalk();
    const walk = await startWalk.mutateAsync(dog.dogId);
    setActiveWalk(walk);
    router.push('/walk/active');
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {dog ? (
        <View style={styles.header}>
          <View style={styles.avatar} />
          <View>
            <Text style={styles.dogName}>{dog.name}</Text>
            <Text style={styles.dogBreed}>
              {dog.breed} · {calculateAge(dog.birthDate)}살
            </Text>
          </View>
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
      {recentDiary ? (
        <Card
          style={styles.recentCard}
          onTouchEnd={() => router.push(`/diary/${recentDiary.diaryId}`)}
        >
          <View style={styles.recentThumb} />
          <View style={styles.recentBody}>
            <Text style={styles.recentDate}>{formatDate(recentDiary.createdAt)}</Text>
            <Text style={styles.recentQuote} numberOfLines={1}>
              {recentDiary.dailyQuote}
            </Text>
          </View>
        </Card>
      ) : (
        <Text style={styles.emptyText}>아직 작성된 일기가 없어요</Text>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md, paddingBottom: spacing.xl },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm + 2, marginBottom: spacing.md },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.apricot,
  },
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
  recentCard: { flexDirection: 'row', gap: spacing.sm + 2, alignItems: 'center' },
  recentThumb: {
    width: 46,
    height: 46,
    borderRadius: radius.sm,
    backgroundColor: colors.clay,
  },
  recentBody: { flex: 1 },
  recentDate: { fontSize: 10, color: colors.grey, marginBottom: 2 },
  recentQuote: { fontSize: 12, fontWeight: '600', color: colors.ink },
  emptyText: { fontSize: 12, color: colors.grey },
});
