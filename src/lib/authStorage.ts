import AsyncStorage from '@react-native-async-storage/async-storage';

const AUTH_STORAGE_KEY = 'meongmeonglog.auth';

interface StoredAuth {
  userId: string;
  provider: 'kakao' | 'naver';
}

export async function persistAuthSession(session: StoredAuth): Promise<void> {
  await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
}

export async function loadAuthSession(): Promise<StoredAuth | null> {
  const raw = await AsyncStorage.getItem(AUTH_STORAGE_KEY);
  if (!raw) return null;
  return JSON.parse(raw) as StoredAuth;
}

export async function clearAuthSession(): Promise<void> {
  await AsyncStorage.removeItem(AUTH_STORAGE_KEY);
}
