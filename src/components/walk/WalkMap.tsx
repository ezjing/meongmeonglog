import { useEffect, useRef } from "react";
import { Platform, StyleSheet } from "react-native";
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from "react-native-maps";

import { colors } from "@/constants/theme";

interface MapCoordinate {
  latitude: number;
  longitude: number;
}

interface WalkMapProps {
  routePath: MapCoordinate[];
}

/** 서울시청 기준 */
const DEFAULT_REGION = {
  latitude: 37.566535,
  longitude: 126.977969,
  latitudeDelta: 0.01,
  longitudeDelta: 0.01,
};

export function WalkMap({ routePath }: WalkMapProps) {
  const mapRef = useRef<MapView>(null);
  const lastPoint = routePath.at(-1);

  useEffect(() => {
    if (!lastPoint) return;

    mapRef.current?.animateToRegion(
      {
        ...lastPoint,
        latitudeDelta: 0.005,
        longitudeDelta: 0.005,
      },
      300,
    );
  }, [lastPoint?.latitude, lastPoint?.longitude]);

  return (
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
      provider={Platform.OS === "android" ? PROVIDER_GOOGLE : undefined}
      showsUserLocation
      showsMyLocationButton={false}
      scrollEnabled={false}
      zoomEnabled={false}
      rotateEnabled={false}
      pitchEnabled={false}
    >
      {routePath.length > 1 && (
        <Polyline
          coordinates={routePath}
          strokeColor={colors.apricot}
          strokeWidth={3}
        />
      )}
      {lastPoint && <Marker coordinate={lastPoint} />}
    </MapView>
  );
}

const styles = StyleSheet.create({
  map: { flex: 1, backgroundColor: colors.background },
});
