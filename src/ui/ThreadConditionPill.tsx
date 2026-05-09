import { StyleSheet, Text, View } from "react-native";

import type { ThreadCondition } from "../types";
import { colors, font, radius } from "./theme";

type Props = {
  condition: ThreadCondition;
};

export function ThreadConditionPill({ condition }: Props) {
  const palette = condition === "partial"
    ? {
        background: colors.warnSoft,
        border: "#edd6b1",
        dot: colors.warn,
        text: "#94611d",
        label: "Partial skein"
      }
    : {
        background: colors.card2,
        border: colors.ruleSoft,
        dot: colors.ok,
        text: colors.ink3,
        label: "Full skein"
      };

  return (
    <View style={[styles.pill, { backgroundColor: palette.background, borderColor: palette.border }]}>
      <View style={[styles.dot, { backgroundColor: palette.dot }]} />
      <Text style={[styles.label, { color: palette.text }]}>{palette.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderRadius: radius.pill,
    paddingHorizontal: 9,
    paddingVertical: 5,
    alignSelf: "flex-start"
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 999
  },
  label: {
    fontFamily: font.sansMedium,
    fontSize: 11,
    lineHeight: 15
  }
});
