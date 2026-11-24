import { useQueryClient } from '@tanstack/react-query';
import { router, useLocalSearchParams } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { dogKeys, DogAvatar, formatWalkPartyName } from '@/entities/dog';
import {
  formatInviteAcceptTitle,
  inviteWarningMessage,
  useAcceptHouseholdInvite,
  useInvitePreview,
} from '@/entities/household';
import { colors, spacing, fontSize, fontWeight } from '@/shared/config/theme';
import { firstParam } from '@/shared/lib/firstParam';
import { Button } from '@/shared/ui/Button';
import { useOverlay } from '@/shared/ui/overlay';
import { StackAppBar } from '@/shared/ui/StackAppBar';

const DOG_AVATAR_SIZE = 56;

export function InviteAcceptScreen() {
  const params = useLocalSearchParams<{ code?: string }>();
  const code = firstParam(params.code) ?? '';
  const { data, isLoading, isError, error, refetch } = useInvitePreview(code);
  const acceptInvite = useAcceptHouseholdInvite();
  const queryClient = useQueryClient();
  const { showToast } = useOverlay();

  const handleAccept = async () => {
    try {
      await acceptInvite.mutateAsync(code);
      await queryClient.invalidateQueries({ queryKey: dogKeys.all });
      showToast({ message: '가족이 되었어요', variant: 'success' });
      router.replace('/(tabs)');
    } catch (acceptError) {
      const warning = inviteWarningMessage(acceptError);
      showToast({
        message: warning ?? '가족이 되지 못했어요. 잠시 후 다시 시도해 주세요.',
        variant: warning ? 'warning' : 'error',
      });
    }
  };

  const screenTitle = data ? formatInviteAcceptTitle(data.inviterTitle) : '초대 코드 입력';

  const dogNames =
    data && data.dogs.length > 0
      ? `${formatWalkPartyName(data.dogs[0]?.name ?? '', Math.max(data.dogs.length - 1, 0))}의 산책 일기를 함께 보고 기록할 수 있어요`
      : '아직 등록된 강아지가 없어요. 가족이 되면 함께 기록할 수 있어요';

  return (
    <View style={styles.screen}>
      <StackAppBar title={screenTitle} onBackPress={() => router.back()} />
      <ScrollView contentContainerStyle={styles.content}>
        {isLoading ? <Text style={styles.muted}>불러오는 중...</Text> : null}
        {isError ? (
          <View style={styles.errorBox}>
            <Text style={styles.muted}>
              {inviteWarningMessage(error) ?? '초대 정보를 불러오지 못했어요'}
            </Text>
            {inviteWarningMessage(error) ? null : (
              <Button label="다시 시도" variant="secondary" onPress={() => refetch()} />
            )}
          </View>
        ) : null}
        {data ? (
          <>
            <Text style={styles.description}>{dogNames}</Text>
            <View style={styles.dogRow}>
              {data.dogs.map((dog) => (
                <View key={`${dog.name}-${dog.createdAt}`} style={styles.dog}>
                  <DogAvatar imageUri={dog.profileImageUrl} size={DOG_AVATAR_SIZE} />
                  <Text style={styles.dogName}>{dog.name}</Text>
                </View>
              ))}
            </View>
            <Button
              label="가족 되기"
              onPress={handleAccept}
              loading={acceptInvite.isPending}
              style={styles.accept}
            />
          </>
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.md, paddingBottom: spacing.xl, gap: spacing.md },
  description: { fontSize: fontSize.lg, fontWeight: fontWeight.bold, color: colors.fg },
  dogRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  dog: { alignItems: 'center', gap: spacing.xs, width: DOG_AVATAR_SIZE + spacing.lg },
  dogName: { fontSize: fontSize.sm, color: colors.fgSecondary, textAlign: 'center' },
  accept: { marginTop: spacing.sm },
  muted: { color: colors.fgMuted, fontSize: fontSize.base },
  errorBox: { gap: spacing.sm },
});
