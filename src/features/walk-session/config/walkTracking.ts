/** 네이티브·웹이 같은 간격으로 위치를 받는다 */
export const LOCATION_INTERVAL_MS = 5_000;
export const LOCATION_DISTANCE_INTERVAL_M = 5;

export interface WebGeoFix {
  latitude: number;
  longitude: number;
  accuracy: number | null;
  timestamp: number;
}

/** 서울시청 */
export const DEFAULT_MAP_LATITUDE = 37.566535;
export const DEFAULT_MAP_LONGITUDE = 126.977969;

/** 경로 선 두께. 네이티브는 strokeWidth, 웹은 strokeWeight */
export const ROUTE_STROKE_WIDTH = 3;
