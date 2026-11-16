interface ScreenWakeLock {
  release: () => Promise<void>;
  addEventListener?: (type: 'release', listener: () => void) => void;
}

let sentinel: ScreenWakeLock | null = null;

function wakeLockApi(): { request: (type: 'screen') => Promise<ScreenWakeLock> } | null {
  if (typeof navigator === 'undefined') return null;
  const nav = navigator as Navigator & {
    wakeLock?: { request: (type: 'screen') => Promise<ScreenWakeLock> };
  };
  return nav.wakeLock ?? null;
}

/** 산책 중 화면이 꺼지지 않게 한다. 제스처 밖이거나 미지원이면 조용히 넘어간다. */
export function acquireWebWalkWakeLock(): void {
  const api = wakeLockApi();
  if (!api || sentinel) return;

  api
    .request('screen')
    .then((lock) => {
      sentinel = lock;
      lock.addEventListener?.('release', () => {
        if (sentinel === lock) sentinel = null;
      });
    })
    .catch(() => {});
}

export function releaseWebWalkWakeLock(): void {
  const current = sentinel;
  sentinel = null;
  current?.release().catch(() => {});
}
