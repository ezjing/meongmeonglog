import * as Location from 'expo-location';
import { PermissionsAndroid, Platform } from 'react-native';

async function requestAndroidNotificationPermission(): Promise<boolean> {
  if (Platform.OS !== 'android' || Platform.Version < 33) return true;

  const current = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS);
  if (current) return true;

  const result = await PermissionsAndroid.request(
    PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
  );
  return result === PermissionsAndroid.RESULTS.GRANTED;
}

/** 산책 기록에 필요한 권한: 위치(iOS는 항상 허용) + Android 13 이상은 알림(포그라운드 서비스) */
export async function requestWalkLocationPermissions(): Promise<boolean> {
  const foreground = await Location.requestForegroundPermissionsAsync();
  if (foreground.status !== 'granted') return false;

  if (Platform.OS === 'android') {
    return requestAndroidNotificationPermission();
  }

  if (Platform.OS === 'ios') {
    const background = await Location.requestBackgroundPermissionsAsync();
    return background.status === 'granted';
  }

  return true;
}
