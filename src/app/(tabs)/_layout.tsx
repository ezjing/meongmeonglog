import { Tabs } from 'expo-router';
import { StyleSheet, Text } from 'react-native';

import { colors } from '@/constants/theme';

function TabIcon({ label, focused }: { label: string; focused: boolean }) {
  const icons: Record<string, string> = {
    index: '🏠',
    calendar: '📅',
    list: '📋',
    settings: '⚙️',
  };
  return (
    <Text style={{ fontSize: 16, opacity: focused ? 1 : 0.5 }}>
      {icons[label] ?? '•'}
    </Text>
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
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
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: colors.white,
    borderTopColor: colors.line,
    height: 56,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '600',
  },
});
