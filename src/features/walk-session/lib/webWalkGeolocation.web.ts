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
  geo.getCurrentPosition(publish, () => {}, COARSE_OPTIONS);
  geo.watchPosition(publish, () => {}, FINE_OPTIONS);
  geo.watchPosition(publish, () => {}, COARSE_OPTIONS);
}

export function subscribeWebWalkGeolocation(listener: (fix: WebGeoFix) => void): () => void {
  primeWebWalkGeolocation();
  listeners.add(listener);
  if (latest) listener(latest);
  return () => {
    listeners.delete(listener);
  };
}
