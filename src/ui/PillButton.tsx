import type { ReactNode } from "react";
import { Pressable, ScrollView, StyleSheet, Text } from "react-native";
import type { StyleProp, TextStyle, ViewStyle } from "react-native";

import { colors, font } from "./theme";
import {
  pillCountLineHeight,
  pillFrameStyle,
  pillLabelLineHeight,
  pillRowContentStyle,
  pillRowViewportStyle
} from "./pillStyles";

export function PillRow({
  children,
  contentContainerStyle
}: {
  children: ReactNode;
  contentContainerStyle?: StyleProp<ViewStyle>;
}) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.viewport}
      contentContainerStyle={[styles.row, contentContainerStyle]}
    >
      {children}
    </ScrollView>
  );
}

export function PillButton({
  label,
  active,
  onPress,
  count,
  warn = false,
  style
}: {
  label: string;
  active: boolean;
  onPress: () => void;
  count?: number;
  warn?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.button,
        active && styles.buttonActive,
        warn && !active && styles.buttonWarn,
        style
      ]}
    >
      <Text
        numberOfLines={1}
        style={[
          styles.label,
          active && styles.labelActive,
          warn && !active && styles.labelWarn
        ]}
      >
        {label}
      </Text>
      {typeof count === "number" ? (
        <Text numberOfLines={1} style={[styles.count, active && styles.countActive]}>
          {count}
        </Text>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  viewport: {
    ...pillRowViewportStyle
  },
  row: {
    ...pillRowContentStyle
  },
  button: {
    ...pillFrameStyle,
    gap: 6,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.rule
  },
  buttonActive: {
    backgroundColor: colors.ink,
    borderColor: colors.ink
  },
  buttonWarn: {
    borderColor: colors.accentSoft
  },
  label: {
    fontFamily: font.sansMedium,
    fontSize: 12,
    lineHeight: pillLabelLineHeight,
    color: colors.ink2
  } satisfies TextStyle,
  labelActive: {
    color: colors.card
  },
  labelWarn: {
    color: colors.accent
  },
  count: {
    fontFamily: font.mono,
    fontSize: 10,
    lineHeight: pillCountLineHeight,
    color: colors.ink4
  } satisfies TextStyle,
  countActive: {
    color: "rgba(250,246,236,0.7)"
  }
});
