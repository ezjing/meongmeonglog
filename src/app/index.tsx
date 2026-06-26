import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';

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
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator color={colors.apricot} />
      </View>
    );
  }

  if (!userId) {
    return <Redirect href="/(auth)/login" />;
  }

  return <Redirect href="/(tabs)" />;
}
