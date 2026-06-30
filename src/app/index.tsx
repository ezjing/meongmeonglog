import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { loadAuthSession } from '@/lib/authStorage';
import { colors } from '@/constants/theme';
import { useAuthStore } from '@/stores/walkStore';

export default function Index() {
  const userId = useAuthStore((s) => s.userId);
  const setSession = useAuthStore((s) => s.setSession);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    loadAuthSession().then((stored) => {
      if (stored) setSession(stored.userId, stored.provider);
      setReady(true);
    });
  }, [setSession]);

  if (!ready) {
    return (
      <SafeAreaView style={styles.loading}>
        <ActivityIndicator color={colors.apricot} />
      </SafeAreaView>
    );
  }

  if (!userId) {
    return <Redirect href="/(auth)/login" />;
  }

  return <Redirect href="/(tabs)" />;
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
});
