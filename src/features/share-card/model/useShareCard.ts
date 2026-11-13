import { useMutation } from '@tanstack/react-query';

import { createShareCard } from '@/entities/diary';
import { AnalyticsEvents, trackEvent } from '@/shared/lib/analytics';

export function useShareCard() {
  return useMutation({
    mutationFn: createShareCard,
    onSuccess: () => trackEvent(AnalyticsEvents.shareCardCreated),
  });
}
