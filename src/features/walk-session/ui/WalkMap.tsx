import { memo, useEffect, useMemo, useRef, useState } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';

import { splitWalkPath, type WalkCoord } from '@/entities/walk';
import { colors } from '@/shared/config/theme';

import {
  DEFAULT_MAP_LATITUDE,
  DEFAULT_MAP_LONGITUDE,
  ROUTE_STROKE_WIDTH,
} from '../config/walkTracking';
import { RecenterMapButton } from './RecenterMapButton';

interface WalkMapProps {
  routePath: WalkCoord[];
}

/** 서울시청 기준 */
const DEFAULT_REGION = {
  latitude: DEFAULT_MAP_LATITUDE,
  longitude: DEFAULT_MAP_LONGITUDE,
  latitudeDelta: 0.01,
  longitudeDelta: 0.01,
};

const FOLLOW_DELTA = {
  latitudeDelta: 0.005,
  longitudeDelta: 0.005,
};

/** 산책 화면의 1초 타이머로 부모가 다시 그려져도 경로가 그대로면 지도는 다시 그리지 않는다 */
export const WalkMap = memo(function WalkMap({ routePath }: WalkMapProps) {
  const mapRef = useRef<MapView>(null);
  const lastPoint = routePath.at(-1);
  const segments = useMemo(() => splitWalkPath(routePath), [routePath]);
  const [followUser, setFollowUser] = useState(true);

  const lastLatitude = lastPoint?.latitude;
  const lastLongitude = lastPoint?.longitude;

  useEffect(() => {
    if (lastLatitude == null || lastLongitude == null || !followUser) return;

    mapRef.current?.animateToRegion(
      { latitude: lastLatitude, longitude: lastLongitude, ...FOLLOW_DELTA },
      300,
    );
  }, [lastLatitude, lastLongitude, followUser]);

  const handleUserMapInteraction = () => {
    setFollowUser(false);
  };

  const handleRecenter = () => {
    if (!lastPoint) return;

    setFollowUser(true);
    mapRef.current?.animateToRegion(
      {
        ...lastPoint,
        ...FOLLOW_DELTA,
      },
      300,
    );
  };

  return (
    <View style={styles.wrap}>
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={
          lastPoint
            ? {
                ...lastPoint,
                latitudeDelta: 0.01,
                longitudeDelta: 0.01,
              }
            : DEFAULT_REGION
        }
        provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
        showsUserLocation
        showsMyLocationButton={false}
        scrollEnabled
        zoomEnabled
        rotateEnabled={false}
        pitchEnabled={false}
        onPanDrag={handleUserMapInteraction}
        onRegionChangeStart={(_, details) => {
          if (details?.isGesture) {
            handleUserMapInteraction();
          }
        }}
      >
        {segments.map((segment, index) =>
          segment.length > 1 ? (
            <Polyline
              key={index}
              coordinates={segment}
              strokeColor={colors.primary}
              strokeWidth={ROUTE_STROKE_WIDTH}
            />
          ) : null,
        )}
        {lastPoint && <Marker coordinate={lastPoint} />}
      </MapView>

      {!followUser && lastPoint ? <RecenterMapButton onPress={handleRecenter} /> : null}
    </View>
  );
});

const styles = StyleSheet.create({
  wrap: { flex: 1 },
  map: { flex: 1, backgroundColor: colors.bg },
});
