/** 웹 산책 위치 구독. 네이티브 백그라운드 태스크 대신 features 쪽이 연결한다. */
interface WebWalkWatch {
  isRunning: () => boolean;
  pause: () => Promise<void>;
}

let current: WebWalkWatch | null = null;

export function bindWebWalkWatch(watch: WebWalkWatch) {
  current = watch;
}

export function isWebWalkWatchRunning() {
  return current?.isRunning() ?? false;
}

export function pauseWebWalkWatch() {
  return current?.pause() ?? Promise.resolve();
}
