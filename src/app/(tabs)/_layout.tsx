import { Tabs } from 'expo-router';
import { StyleSheet, Text } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors } from '@/constants/theme';

function TabIcon({ label, focused }: { label: string; focused: boolean }) {
  const icons: Record<string, string> = {
    index: '🏠',
    calendar: '📅',
    list: '📋',
    settings: '⚙️',
  };
  return <Text style={{ fontSize: 16, opacity: focused ? 1 : 0.5 }}>{icons[label] ?? '•'}</Text>;
}

const TAB_BAR_HEIGHT = 56;

export default function TabsLayout() {
  const insets = useSafeAreaInsets();

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            ...styles.tabBar,
            height: TAB_BAR_HEIGHT + insets.bottom,
            paddingBottom: insets.bottom,
          },
          tabBarActiveTintColor: colors.apricotDark,
          tabBarInactiveTintColor: colors.grey,
          tabBarLabelStyle: styles.tabLabel,
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: '홈',
            tabBarIcon: ({ focused }) => <TabIcon label="index" focused={focused} />,
          }}
        />
        <Tabs.Screen
          name="calendar"
          options={{
            title: '캘린더',
            tabBarIcon: ({ focused }) => <TabIcon label="calendar" focused={focused} />,
          }}
        />
        <Tabs.Screen
          name="list"
          options={{
            title: '리스트',
            tabBarIcon: ({ focused }) => <TabIcon label="list" focused={focused} />,
          }}
        />
        <Tabs.Screen
          name="settings"
          options={{
            title: '설정',
            tabBarIcon: ({ focused }) => <TabIcon label="settings" focused={focused} />,
          }}
        />
      </Tabs>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  tabBar: {
    backgroundColor: colors.white,
    borderTopColor: colors.line,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '600',
  },
});
