export interface WebGeoFix {
  latitude: number;
  longitude: number;
  accuracy: number | null;
  timestamp: number;
}

const COARSE_OPTIONS: PositionOptions = {
  enableHighAccuracy: false,
  maximumAge: 60_000,
  timeout: 10_000,
};

const FINE_OPTIONS: PositionOptions = {
  enableHighAccuracy: true,
  maximumAge: 5_000,
  timeout: 15_000,
};

let started = false;
let watchIds: number[] = [];
let latest: WebGeoFix | null = null;
const listeners = new Set<(fix: WebGeoFix) => void>();

function publish(position: GeolocationPosition) {
  const fix: WebGeoFix = {
    latitude: position.coords.latitude,
    longitude: position.coords.longitude,
    accuracy: position.coords.accuracy,
    timestamp: position.timestamp,
  };
  latest = fix;
  listeners.forEach((listener) => listener(fix));
}

/**
 * iOS 홈 화면 앱은 탭 직후에 위치를 묻지 않으면 권한 창이 뜨지 않고,
 * 고정밀만 기다리면 시간이 지나도 좌표가 오지 않는다.
 * 버튼 처리 안에서 바로 호출한다.
 */
export function primeWebWalkGeolocation(): void {
  if (started || typeof navigator === 'undefined' || !navigator.geolocation) return;
  started = true;

  const geo = navigator.geolocation;
  geo.getCurrentPosition(publish, handleError, COARSE_OPTIONS);
  watchIds = [
    geo.watchPosition(publish, handleError, FINE_OPTIONS),
    geo.watchPosition(publish, handleError, COARSE_OPTIONS),
  ];
}

/** 위치 감시를 끈다. 다음 prime/subscribe 때 다시 켠다 (GPS·위치 사용 표시가 남지 않도록) */
function stopGeolocation() {
  if (typeof navigator !== 'undefined' && navigator.geolocation) {
    watchIds.forEach((id) => navigator.geolocation.clearWatch(id));
  }
  watchIds = [];
  started = false;
}

function handleError(error: GeolocationPositionError) {
  // 권한을 거부했다가 설정에서 허용한 뒤 다시 시도할 수 있게 한다
  if (error.code === error.PERMISSION_DENIED) stopGeolocation();
}

/** 받는 곳(산책 기록·지도·날씨)이 없으면 위치 감시를 끈다. 산책 시작이 중간에 실패했을 때도 호출한다 */
export function releaseWebWalkGeolocation(): void {
  if (listeners.size === 0) stopGeolocation();
}

export function subscribeWebWalkGeolocation(listener: (fix: WebGeoFix) => void): () => void {
  primeWebWalkGeolocation();
  listeners.add(listener);
  if (latest) listener(latest);
  return () => {
    listeners.delete(listener);
    releaseWebWalkGeolocation();
  };
}
