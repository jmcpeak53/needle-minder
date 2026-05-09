import { Ionicons } from "@expo/vector-icons";
import { usePathname, useRouter } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { colors, font, NAV_HEIGHT } from "./theme";

type NavItem = {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  activeIcon: keyof typeof Ionicons.glyphMap;
  href: string;
  match?: (path: string) => boolean;
};

const NAV_ITEMS: NavItem[] = [
  {
    label: "Home",
    icon: "home-outline",
    activeIcon: "home",
    href: "/",
    match: (p) => p === "/"
  },
  {
    label: "Stash",
    icon: "grid-outline",
    activeIcon: "grid",
    href: "/stash",
    match: (p) => p === "/stash"
  },
  {
    label: "Projects",
    icon: "apps-outline",
    activeIcon: "apps",
    href: "/projects",
    match: (p) => p === "/projects"
  },
  {
    label: "Me",
    icon: "person-outline",
    activeIcon: "person",
    href: "/settings",
    match: (p) => p === "/settings"
  }
];

export function BottomNav() {
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();

  // Hide on detail and other full-screen routes
  if (
    pathname.startsWith("/detail") ||
    pathname.startsWith("/add") ||
    pathname.startsWith("/project") ||
    pathname === "/scan"
  ) {
    return null;
  }

  const bottomOffset = Math.max(insets.bottom, 10) + 8;

  return (
    <View style={[styles.outer, { bottom: bottomOffset }]}>
      <View style={styles.pill}>
        {/* Left two items */}
        {NAV_ITEMS.slice(0, 2).map((item) => {
          const active = item.match ? item.match(pathname) : pathname === item.href;
          return (
            <Pressable
              key={item.href}
              onPress={() => router.push(item.href as never)}
              style={[styles.navItem, active && styles.navItemActive]}
            >
              <Ionicons
                name={active ? item.activeIcon : item.icon}
                size={18}
                color={active ? colors.card : colors.ink3}
              />
              <Text style={[styles.navLabel, active && styles.navLabelActive]}>
                {item.label}
              </Text>
            </Pressable>
          );
        })}

        {/* Center FAB */}
        <Pressable
          onPress={() => router.push("/scan")}
          style={styles.fabWrapper}
        >
          <View style={styles.fab}>
            <Ionicons name="add" size={22} color={colors.card} />
          </View>
        </Pressable>

        {/* Right two items */}
        {NAV_ITEMS.slice(2).map((item) => {
          const active = item.match ? item.match(pathname) : pathname === item.href;
          return (
            <Pressable
              key={item.href}
              onPress={() => router.push(item.href as never)}
              style={[styles.navItem, active && styles.navItemActive]}
            >
              <Ionicons
                name={active ? item.activeIcon : item.icon}
                size={18}
                color={active ? colors.card : colors.ink3}
              />
              <Text style={[styles.navLabel, active && styles.navLabelActive]}>
                {item.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    position: "absolute",
    left: 10,
    right: 10,
    zIndex: 100,
    height: NAV_HEIGHT
  },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.rule,
    borderRadius: 22,
    paddingHorizontal: 8,
    paddingVertical: 8,
    shadowColor: colors.ink,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8
  },
  navItem: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 6,
    paddingHorizontal: 4,
    borderRadius: 14,
    gap: 2
  },
  navItemActive: {
    backgroundColor: colors.ink
  },
  navLabel: {
    fontSize: 10,
    fontFamily: font.sansMedium,
    color: colors.ink3,
    letterSpacing: 0.3
  },
  navLabelActive: {
    color: colors.card
  },
  fabWrapper: {
    flex: 0,
    width: 48,
    alignItems: "center",
    marginHorizontal: 4,
    transform: [{ translateY: -8 }]
  },
  fab: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.accent,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.38,
    shadowRadius: 12,
    elevation: 6
  }
});
