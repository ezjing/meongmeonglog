import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { AppState, Platform } from 'react-native';

const isServer = typeof window === 'undefined';

const authStorage = isServer
  ? {
      getItem: async () => null,
      setItem: async () => {},
      removeItem: async () => {},
    }
  : Platform.OS === 'web'
    ? {
        getItem: (key: string) => Promise.resolve(window.localStorage.getItem(key)),
        setItem: (key: string, value: string) => {
          window.localStorage.setItem(key, value);
          return Promise.resolve();
        },
        removeItem: (key: string) => {
          window.localStorage.removeItem(key);
          return Promise.resolve();
        },
      }
    : AsyncStorage;

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: authStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// React Native는 브라우저처럼 자동 토큰 갱신이 돌지 않아 앱이 포그라운드일 때만 직접 켠다 (Supabase RN 가이드)
if (!isServer && Platform.OS !== 'web' && isSupabaseConfigured) {
  if (AppState.currentState === 'active') {
    void supabase.auth.startAutoRefresh();
  }
  AppState.addEventListener('change', (state) => {
    if (state === 'active') {
      void supabase.auth.startAutoRefresh();
    } else {
      void supabase.auth.stopAutoRefresh();
    }
  });
}
