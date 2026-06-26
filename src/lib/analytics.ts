const events: string[] = [];

export function trackEvent(name: string, params?: Record<string, string | number | boolean>) {
  if (__DEV__) {
    console.log('[analytics]', name, params ?? {});
  }
  events.push(name);
}

export const AnalyticsEvents = {
  loginComplete: 'login_complete',
  dogRegistered: 'dog_registered',
  walkStarted: 'walk_started',
  walkFinished: 'walk_finished',
  diaryGenerated: 'diary_generated',
  shareCardCreated: 'share_card_created',
} as const;

export function getTrackedEvents(): string[] {
  return [...events];
}
