export interface WebGeoFix {
  latitude: number;
  longitude: number;
  accuracy: number | null;
  timestamp: number;
}

/** 네이티브 위치는 expo-location이 받는다. */
export function primeWebWalkGeolocation(): void {}

export function subscribeWebWalkGeolocation(_listener: (fix: WebGeoFix) => void): () => void {
  return () => {};
}
