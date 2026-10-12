import { useEffect, useRef, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';

import { colors, spacing, radius, fontSize, sizes, shadows } from '@/constants/theme';

interface MapCoordinate {
  latitude: number;
  longitude: number;
}

interface WalkMapProps {
  routePath: MapCoordinate[];
}

/** 서울시청 기준 */
const ROUTE_STROKE_WIDTH = 3;

const DEFAULT_REGION = {
  latitude: 37.566535,
  longitude: 126.977969,
  latitudeDelta: 0.01,
  longitudeDelta: 0.01,
};

const FOLLOW_DELTA = {
  latitudeDelta: 0.005,
  longitudeDelta: 0.005,
};

export function WalkMap({ routePath }: WalkMapProps) {
  const mapRef = useRef<MapView>(null);
  const lastPoint = routePath.at(-1);
  const [followUser, setFollowUser] = useState(true);

  useEffect(() => {
    if (!lastPoint || !followUser) return;

    mapRef.current?.animateToRegion(
      {
        ...lastPoint,
        ...FOLLOW_DELTA,
      },
      300,
    );
  }, [lastPoint, followUser]);

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
        {routePath.length > 1 && (
          <Polyline
            coordinates={routePath}
            strokeColor={colors.apricot}
            strokeWidth={ROUTE_STROKE_WIDTH}
          />
        )}
        {lastPoint && <Marker coordinate={lastPoint} />}
      </MapView>

      {!followUser && lastPoint ? (
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
}

const styles = StyleSheet.create({
  wrap: { flex: 1 },
  map: { flex: 1, backgroundColor: colors.background },
  recenterBtn: {
    position: 'absolute',
    right: spacing.ms,
    bottom: spacing.ms,
    backgroundColor: colors.white,
    borderRadius: radius.full,
    width: sizes.control,
    height: sizes.control,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.sm,
  },
  recenterText: { fontSize: fontSize.lg },
});
