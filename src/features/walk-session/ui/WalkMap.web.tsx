import { memo, useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { splitWalkPath, type WalkCoord } from '@/entities/walk';
import { colors, spacing } from '@/shared/config/theme';

import { RecenterMapButton } from './RecenterMapButton';
import {
  DEFAULT_MAP_LATITUDE,
  DEFAULT_MAP_LONGITUDE,
  ROUTE_STROKE_WIDTH,
} from '../config/walkTracking';
import { subscribeWebWalkGeolocation } from '../lib/webWalkGeolocation';

const GOOGLE_MAPS_WEB_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_WEB_API_KEY;

interface WalkMapProps {
  routePath: WalkCoord[];
}

/** 서울시청 기준. 네이티브 지도의 기본 위치와 같다. */
const DEFAULT_CENTER = { lat: DEFAULT_MAP_LATITUDE, lng: DEFAULT_MAP_LONGITUDE };
const FOLLOW_ZOOM = 16;

interface LatLng {
  lat: number;
  lng: number;
}

interface GoogleMap {
  panTo: (position: LatLng) => void;
  addListener: (event: string, handler: () => void) => { remove: () => void };
}

interface GooglePolyline {
  setPath: (path: LatLng[]) => void;
  setMap: (map: GoogleMap | null) => void;
}

interface GoogleMarker {
  setPosition: (position: LatLng) => void;
}

interface GoogleMaps {
  Map: new (element: HTMLElement, options: object) => GoogleMap;
  Polyline: new (options: object) => GooglePolyline;
  Marker: new (options: object) => GoogleMarker;
  event: { clearInstanceListeners: (instance: object) => void };
}

let mapsPromise: Promise<GoogleMaps> | null = null;

function loadGoogleMaps(apiKey: string): Promise<GoogleMaps> {
  const existing = (globalThis as { google?: { maps?: GoogleMaps } }).google?.maps;
  if (existing) return Promise.resolve(existing);
  if (mapsPromise) return mapsPromise;

  mapsPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&v=weekly`;
    script.async = true;
    script.onload = () => {
      const maps = (globalThis as { google?: { maps?: GoogleMaps } }).google?.maps;
      if (maps) resolve(maps);
      else reject(new Error('maps unavailable'));
    };
    script.onerror = () => reject(new Error('maps unavailable'));
    document.head.appendChild(script);
  });

  return mapsPromise;
}

function toLatLng(coord: WalkCoord): LatLng {
  return { lat: coord.latitude, lng: coord.longitude };
}

/** 산책 화면의 1초 타이머로 부모가 다시 그려져도 경로가 그대로면 지도는 다시 그리지 않는다 */
export const WalkMap = memo(function WalkMap({ routePath }: WalkMapProps) {
  const hostRef = useRef<View>(null);
  const mapRef = useRef<GoogleMap | null>(null);
  const linesRef = useRef<GooglePolyline[]>([]);
  const markerRef = useRef<GoogleMarker | null>(null);
  const mapsRef = useRef<GoogleMaps | null>(null);
  const routeRef = useRef(routePath);
  const followRef = useRef(true);
  const liveRef = useRef<LatLng | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);
  const mapUnavailable = !GOOGLE_MAPS_WEB_API_KEY || loadFailed;
  const [followUser, setFollowUser] = useState(true);
  const [hasLiveFix, setHasLiveFix] = useState(false);
  const lastPoint = routePath.at(-1);

  routeRef.current = routePath;
  followRef.current = followUser;

  const showLivePosition = useCallback((position: LatLng) => {
    liveRef.current = position;
    setHasLiveFix(true);

    const map = mapRef.current;
    const maps = mapsRef.current;
    if (!map || !maps || routeRef.current.length > 0) return;

    if (!markerRef.current) {
      markerRef.current = new maps.Marker({ map, position });
    } else {
      markerRef.current.setPosition(position);
    }
    if (followRef.current) map.panTo(position);
  }, []);

  const drawRoute = useCallback(() => {
    const map = mapRef.current;
    const maps = mapsRef.current;
    if (!map || !maps) return;

    // 끊긴 구간마다 선을 따로 그린다 (기록되지 않은 구간을 직선으로 잇지 않음)
    const segments = splitWalkPath(routeRef.current);
    const lines = linesRef.current;
    segments.forEach((segment, index) => {
      const path = segment.map(toLatLng);
      if (lines[index]) {
        lines[index].setPath(path);
      } else {
        lines[index] = new maps.Polyline({
          map,
          path,
          strokeColor: colors.primary,
          strokeWeight: ROUTE_STROKE_WIDTH,
        });
      }
    });
    lines.splice(segments.length).forEach((line) => line.setMap(null));

    const point = routeRef.current.at(-1);
    if (!point) return;
    const position = toLatLng(point);
    if (!markerRef.current) {
      markerRef.current = new maps.Marker({ map, position });
    } else {
      markerRef.current.setPosition(position);
    }
    if (followRef.current) map.panTo(position);
  }, []);

  useEffect(() => {
    const apiKey = GOOGLE_MAPS_WEB_API_KEY;
    const host = hostRef.current as unknown as HTMLElement | null;
    if (!apiKey || !host) return;

    let cancelled = false;
    let dragListener: { remove: () => void } | null = null;

    loadGoogleMaps(apiKey)
      .then((maps) => {
        if (cancelled) return;
        const initial = routeRef.current.at(-1);
        const map = new maps.Map(host, {
          center: initial ? toLatLng(initial) : (liveRef.current ?? DEFAULT_CENTER),
          zoom: FOLLOW_ZOOM,
          disableDefaultUI: true,
          zoomControl: true,
          gestureHandling: 'greedy',
          clickableIcons: false,
        });
        dragListener = map.addListener('dragstart', () => setFollowUser(false));
        mapsRef.current = maps;
        mapRef.current = map;
        drawRoute();
        if (!routeRef.current.length && liveRef.current) showLivePosition(liveRef.current);
      })
      .catch(() => {
        mapsPromise = null;
        if (!cancelled) setLoadFailed(true);
      });

    return () => {
      cancelled = true;
      dragListener?.remove();
      const map = mapRef.current;
      if (map) mapsRef.current?.event.clearInstanceListeners(map);
      mapRef.current = null;
      linesRef.current = [];
      markerRef.current = null;
    };
  }, [drawRoute, showLivePosition]);

  useEffect(() => {
    drawRoute();
  }, [drawRoute, routePath, followUser]);

  useEffect(() => {
    return subscribeWebWalkGeolocation((fix) => {
      showLivePosition({ lat: fix.latitude, lng: fix.longitude });
    });
  }, [showLivePosition]);

  const handleRecenter = () => {
    const target = lastPoint ? toLatLng(lastPoint) : liveRef.current;
    if (!target || !mapRef.current) return;
    setFollowUser(true);
    mapRef.current.panTo(target);
  };

  return (
    <View style={styles.wrap}>
      <View ref={hostRef} style={styles.map} />
      {mapUnavailable ? (
        <View style={styles.fallback} pointerEvents="none">
          <Text style={styles.fallbackText}>지도를 불러오지 못했어요</Text>
        </View>
      ) : null}
      {!followUser && (lastPoint || hasLiveFix) ? (
        <RecenterMapButton onPress={handleRecenter} />
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  wrap: { flex: 1 },
  map: { flex: 1, backgroundColor: colors.bg },
  fallback: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.md,
  },
  fallbackText: { color: colors.fgMuted, textAlign: 'center' },
});
