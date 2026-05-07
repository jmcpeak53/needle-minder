import { Tabs } from "expo-router";

import { BottomNav } from "../../src/ui/BottomNav";

export default function TabsLayout() {
  return (
    <Tabs
      tabBar={() => <BottomNav />}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="stash" />
      <Tabs.Screen name="scan" />
      <Tabs.Screen name="add" options={{ href: null }} />
      <Tabs.Screen name="settings" options={{ href: null }} />
      <Tabs.Screen name="projects" options={{ href: null }} />
    </Tabs>
  );
}
