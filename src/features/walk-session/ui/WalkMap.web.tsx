import { memo, useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { WalkCoord } from '@/entities/walk';
import { colors, fontSize, radius, shadows, sizes, spacing } from '@/shared/config/theme';

interface WalkMapProps {
  routePath: WalkCoord[];
}

/** 서울시청 기준. 네이티브 지도의 기본 위치와 같다. */
const DEFAULT_CENTER = { lat: 37.566535, lng: 126.977969 };
const FOLLOW_ZOOM = 16;
const ROUTE_STROKE_WEIGHT = 3;

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
  const lineRef = useRef<GooglePolyline | null>(null);
  const markerRef = useRef<GoogleMarker | null>(null);
  const mapsRef = useRef<GoogleMaps | null>(null);
  const routeRef = useRef(routePath);
  const followRef = useRef(true);
  const liveRef = useRef<LatLng | null>(null);
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

    const path = routeRef.current.map(toLatLng);
    if (!lineRef.current) {
      lineRef.current = new maps.Polyline({
        map,
        path,
        strokeColor: colors.primary,
        strokeWeight: ROUTE_STROKE_WEIGHT,
      });
    } else {
      lineRef.current.setPath(path);
    }

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
    const apiKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_WEB_API_KEY;
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
      });

    return () => {
      cancelled = true;
      dragListener?.remove();
      const map = mapRef.current;
      if (map) mapsRef.current?.event.clearInstanceListeners(map);
      mapRef.current = null;
      lineRef.current = null;
      markerRef.current = null;
    };
  }, [drawRoute, showLivePosition]);

  useEffect(() => {
    drawRoute();
  }, [drawRoute, routePath, followUser]);

  useEffect(() => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) return;

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        showLivePosition({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
      },
      () => {},
      { enableHighAccuracy: true, maximumAge: 5_000, timeout: 15_000 },
    );

    return () => navigator.geolocation.clearWatch(watchId);
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
      {!followUser && (lastPoint || hasLiveFix) ? (
        <Pressable
          style={styles.recenterBtn}
          onPress={handleRecenter}
          accessibilityRole="button"
          accessibilityLabel="내 위치로 이동"
        >
          <Text style={styles.recenterText}>📍</Text>
        </Pressable>
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  wrap: { flex: 1 },
  map: { flex: 1, backgroundColor: colors.bg },
  recenterBtn: {
    position: 'absolute',
    right: spacing.ms,
    bottom: spacing.ms,
    backgroundColor: colors.surface,
    borderRadius: radius.full,
    width: sizes.iconButton,
    height: sizes.iconButton,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.control,
  },
  recenterText: { fontSize: fontSize.lg },
});
