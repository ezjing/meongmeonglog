import type { WebGeoFix } from '../config/walkTracking';

/** 네이티브 위치는 expo-location이 받는다. */
export function primeWebWalkGeolocation(): void {}

export function releaseWebWalkGeolocation(): void {}

export function subscribeWebWalkGeolocation(_listener: (fix: WebGeoFix) => void): () => void {
  return () => {};
}
