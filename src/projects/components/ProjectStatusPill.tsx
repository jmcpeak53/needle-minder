import { StyleSheet, Text, View } from "react-native";

import { getProjectStatusLabel } from "../projectMath";
import type { ProjectStatus } from "../types";
import { colors, font } from "../../ui/theme";
import { pillFrameStyle, pillLabelLineHeight } from "../../ui/pillStyles";

export function ProjectStatusPill({ status }: { status: ProjectStatus }) {
  const palette = statusPalette(status);

  return (
    <View style={[styles.pill, { backgroundColor: palette.background, borderColor: palette.border }]}>
      <View style={[styles.dot, { backgroundColor: palette.dot }]} />
      <Text style={[styles.label, { color: palette.text }]}>{getProjectStatusLabel(status)}</Text>
    </View>
  );
}

function statusPalette(status: ProjectStatus) {
  switch (status) {
    case "finished":
      return {
        background: colors.okSoft,
        border: "#cedcc4",
        dot: colors.ok,
        text: colors.ok
      };
    case "wip":
      return {
        background: colors.accentTint,
        border: colors.accentSoft,
        dot: colors.accent,
        text: colors.accent
      };
    case "pattern":
      return {
        background: colors.warnSoft,
        border: "#edd6b1",
        dot: colors.warn,
        text: "#94611d"
      };
    case "not_started":
      return {
        background: colors.card2,
        border: colors.ruleSoft,
        dot: colors.ink4,
        text: colors.ink3
      };
  }
}

const styles = StyleSheet.create({
  pill: {
    ...pillFrameStyle,
    gap: 6,
    borderWidth: 1,
    minHeight: 28,
    paddingHorizontal: 9,
    paddingVertical: 5
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 999
  },
  label: {
    fontFamily: font.sansMedium,
    fontSize: 11,
    lineHeight: pillLabelLineHeight
  }
});
