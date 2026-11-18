import { StyleSheet } from 'react-native';

import { useDiaryShareLink } from '@/features/share-link';
import { spacing } from '@/shared/config/theme';
import { Button } from '@/shared/ui/Button';
import { useOverlay } from '@/shared/ui/overlay/index';

interface ShareLinkActionsProps {
  diaryId: string;
}

export function ShareLinkActions({ diaryId }: ShareLinkActionsProps) {
  const { showToast } = useOverlay();
  const { isActive, share, stop, shareNow } = useDiaryShareLink(diaryId);

  const handleShare = async () => {
    try {
      const result = await shareNow();
      if (result === 'copied') {
        showToast({ message: '링크를 복사했어요', variant: 'success' });
      }
    } catch {
      showToast({ message: '공유 링크를 만들지 못했어요', variant: 'error' });
    }
  };

  const handleStop = async () => {
    try {
      await stop.mutateAsync();
      showToast({ message: '공유를 중지했어요', variant: 'success' });
    } catch {
      showToast({ message: '공유를 중지하지 못했어요', variant: 'error' });
    }
  };

  return (
    <>
      <Button
        label="🔗  링크 공유"
        onPress={handleShare}
        loading={share.isPending}
        style={styles.button}
      />
      {isActive ? (
        <Button
          label="공유 중지"
          variant="text"
          onPress={handleStop}
          loading={stop.isPending}
          style={styles.button}
        />
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  button: { marginBottom: spacing.sm },
});
