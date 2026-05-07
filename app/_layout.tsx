import "expo-dev-client";

import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";

import { NeedleMinderProvider } from "../src/state/NeedleMinderContext";
import { colors } from "../src/ui/theme";

export default function RootLayout() {
  return (
    <NeedleMinderProvider>
      <Tabs
        screenOptions={{
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.ink,
          tabBarActiveTintColor: colors.accent,
          tabBarInactiveTintColor: colors.muted
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: "Inventory",
            tabBarIcon: ({ color, size }) => <Ionicons name="albums-outline" color={color} size={size} />
          }}
        />
        <Tabs.Screen
          name="add"
          options={{
            title: "Add",
            tabBarIcon: ({ color, size }) => <Ionicons name="add-circle-outline" color={color} size={size} />
          }}
        />
        <Tabs.Screen
          name="scan"
          options={{
            title: "Scan",
            tabBarIcon: ({ color, size }) => <Ionicons name="camera-outline" color={color} size={size} />
          }}
        />
        <Tabs.Screen
          name="settings"
          options={{
            title: "Settings",
            tabBarIcon: ({ color, size }) => <Ionicons name="settings-outline" color={color} size={size} />
          }}
        />
      </Tabs>
    </NeedleMinderProvider>
  );
}
