import React from "react";
import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";
import type { ViewStyle } from "react-native";

import { colors, font, radius, spacing } from "./theme";

export interface AppBarProps {
  title: string;
  subtitle?: React.ReactNode;
  center?: React.ReactNode;
  onBack?: () => void;
  trailing?: React.ReactNode;
  style?: ViewStyle;
}

export function AppBar({ title, subtitle, center, onBack, trailing, style }: AppBarProps) {
  return (
    <View style={[styles.container, style]}>
      {onBack ? (
        <Pressable onPress={onBack} style={styles.iconButton}>
          <Ionicons name="chevron-back" size={18} color={colors.ink2} />
        </Pressable>
      ) : null}
      <View style={styles.center}>
        {center ?? (
          <>
            <Text style={styles.title} numberOfLines={1}>
              {title}
            </Text>
            {subtitle !== undefined && subtitle !== null ? (
              typeof subtitle === "string" || typeof subtitle === "number" ? (
                <Text style={styles.subtitle} numberOfLines={1}>
                  {subtitle}
                </Text>
              ) : (
                subtitle
              )
            ) : null}
          </>
        )}
      </View>
      {trailing}
    </View>
  );
}

type AppBarActionProps = {
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  color?: string;
  size?: number;
};

export function AppBarAction({
  icon,
  onPress,
  color = colors.ink2,
  size = 18
}: AppBarActionProps) {
  return (
    <Pressable onPress={onPress} style={styles.iconButton}>
      <Ionicons name={icon} size={size} color={color} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md
  },
  center: {
    flex: 1
  },
  title: {
    fontFamily: font.serif,
    fontSize: 22,
    color: colors.ink,
    lineHeight: 24
  },
  subtitle: {
    fontFamily: font.sans,
    fontSize: 11,
    color: colors.ink3,
    marginTop: 2
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center"
  }
});
