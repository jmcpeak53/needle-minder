import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { ProjectStatusPill } from "./ProjectStatusPill";
import { ProjectImagePlaceholder } from "./ProjectImagePlaceholder";
import type { ProjectSummary } from "../types";
import { colors, font, radius, spacing } from "../../ui/theme";

type Props = {
  summary: ProjectSummary;
  variant: "grid" | "list";
  onPress: () => void;
};

export function ProjectCard({ summary, variant, onPress }: Props) {
  const isList = variant === "list";

  return (
    <Pressable onPress={onPress} style={[styles.card, isList ? styles.cardList : styles.cardGrid]}>
      <View style={[styles.imageWrap, isList ? styles.imageWrapList : styles.imageWrapGrid]}>
        <ProjectImagePlaceholder imageUri={summary.project.imageUri} />
      </View>

      <View style={styles.body}>
        <View style={styles.topRow}>
          <ProjectStatusPill status={summary.project.status} />
          {summary.daysInWip !== null ? (
            <Text style={styles.daysValue}>{summary.daysInWip}d</Text>
          ) : null}
        </View>

        <Text style={styles.name} numberOfLines={isList ? 1 : 2}>
          {summary.project.name}
        </Text>
        <Text style={styles.meta} numberOfLines={1}>
          {projectMeta(summary)}
        </Text>

        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{summary.totalColors}</Text>
            <Text style={styles.statLabel}>colors</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{summary.totalSkeins}</Text>
            <Text style={styles.statLabel}>needed</Text>
          </View>
          <View style={styles.stat}>
            <Text style={[styles.statValue, summary.shortfallSkeins > 0 && styles.statValueWarn]}>
              {summary.shortfallSkeins > 0 ? summary.shortfallSkeins : summary.readyColors}
            </Text>
            <Text style={styles.statLabel}>
              {summary.shortfallSkeins > 0 ? "still need" : "ready"}
            </Text>
          </View>
        </View>

        {summary.shortfallSkeins > 0 ? (
          <View style={styles.shortfallRow}>
            <Ionicons name="bag-handle-outline" size={13} color={colors.accent} />
            <Text style={styles.shortfallText}>
              {summary.shortfallSkeins} skein{summary.shortfallSkeins === 1 ? "" : "s"} still needed
            </Text>
          </View>
        ) : (
          <View style={styles.shortfallRow}>
            <Ionicons name="checkmark-circle-outline" size={13} color={colors.ok} />
            <Text style={styles.readyText}>Ready to stitch</Text>
          </View>
        )}
      </View>
    </Pressable>
  );
}

function projectMeta(summary: ProjectSummary): string {
  const parts = [summary.project.folder ?? "Root"];
  if (summary.project.author) {
    parts.push(summary.project.author);
  }
  return parts.join(" · ");
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.rule,
    borderRadius: radius.lg,
    overflow: "hidden"
  },
  cardGrid: {
    width: "48.3%"
  },
  cardList: {
    flexDirection: "row"
  },
  imageWrap: {
    backgroundColor: colors.card2
  },
  imageWrapGrid: {
    aspectRatio: 1,
    width: "100%"
  },
  imageWrapList: {
    width: 118,
    height: 118,
    margin: spacing.sm
  },
  body: {
    flex: 1,
    padding: spacing.md,
    gap: 8
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm
  },
  daysValue: {
    fontFamily: font.serif,
    fontSize: 20,
    color: colors.ink
  },
  name: {
    fontFamily: font.serif,
    fontSize: 20,
    color: colors.ink,
    lineHeight: 22
  },
  meta: {
    fontFamily: font.sans,
    fontSize: 11,
    color: colors.ink3
  },
  statsRow: {
    flexDirection: "row",
    gap: 10
  },
  stat: {
    flex: 1,
    backgroundColor: colors.card2,
    borderRadius: radius.md,
    paddingHorizontal: 8,
    paddingVertical: 8
  },
  statValue: {
    fontFamily: font.serif,
    fontSize: 20,
    color: colors.ink,
    lineHeight: 22
  },
  statValueWarn: {
    color: colors.accent
  },
  statLabel: {
    fontFamily: font.sans,
    fontSize: 10,
    color: colors.ink3,
    marginTop: 2
  },
  shortfallRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6
  },
  shortfallText: {
    fontFamily: font.sansMedium,
    fontSize: 11,
    color: colors.accent
  },
  readyText: {
    fontFamily: font.sansMedium,
    fontSize: 11,
    color: colors.ok
  }
});
