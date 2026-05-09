import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ProjectCard } from "../../src/projects/components/ProjectCard";
import type { ProjectStatus, ProjectSummary } from "../../src/projects/types";
import { useProjects } from "../../src/state/ProjectsContext";
import { PillButton, PillRow } from "../../src/ui/PillButton";
import { colors, font, NAV_HEIGHT, radius, spacing } from "../../src/ui/theme";

type ViewMode = "grid" | "list";
type SortMode = "status" | "start_date";
type StatusFilter = "all" | ProjectStatus;

export default function ProjectsScreen() {
  const { ready, projectSummaries, shoppingShortfalls } = useProjects();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [sortMode, setSortMode] = useState<SortMode>("status");
  const [filter, setFilter] = useState<StatusFilter>("all");

  const filteredProjects = useMemo(() => {
    const next = filter === "all"
      ? projectSummaries
      : projectSummaries.filter((summary) => summary.project.status === filter);

    return [...next].sort((a, b) => {
      if (sortMode === "start_date") {
        const aDate = a.project.startDate ?? a.project.updatedAt;
        const bDate = b.project.startDate ?? b.project.updatedAt;
        return bDate.localeCompare(aDate);
      }

      return compareByStatusThenDate(a, b);
    });
  }, [filter, projectSummaries, sortMode]);

  const filterCounts = useMemo<Record<StatusFilter, number>>(
    () => ({
      all: projectSummaries.length,
      not_started: projectSummaries.filter((item) => item.project.status === "not_started").length,
      pattern: projectSummaries.filter((item) => item.project.status === "pattern").length,
      wip: projectSummaries.filter((item) => item.project.status === "wip").length,
      finished: projectSummaries.filter((item) => item.project.status === "finished").length
    }),
    [projectSummaries]
  );

  if (!ready) {
    return <View style={[styles.screen, { backgroundColor: colors.bg }]} />;
  }

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: NAV_HEIGHT + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.appbar}>
          <View style={styles.appbarGrow}>
            <Text style={styles.title}>Projects</Text>
            <Text style={styles.subtitle}>
              {projectSummaries.length} project{projectSummaries.length === 1 ? "" : "s"} · {shoppingShortfalls.length} shopping color{shoppingShortfalls.length === 1 ? "" : "s"}
            </Text>
          </View>
          <Pressable style={styles.iconBtn} onPress={() => router.push("/project/shopping")}>
            <Ionicons name="bag-handle-outline" size={18} color={colors.ink2} />
          </Pressable>
          <Pressable style={styles.iconBtn} onPress={() => router.push("/project/new")}>
            <Ionicons name="add" size={18} color={colors.ink2} />
          </Pressable>
        </View>

        <PillRow contentContainerStyle={styles.filterRow}>
          <PillButton label="All" count={filterCounts.all} active={filter === "all"} onPress={() => setFilter("all")} />
          <PillButton label="WIP" count={filterCounts.wip} active={filter === "wip"} onPress={() => setFilter("wip")} />
          <PillButton label="Pattern" count={filterCounts.pattern} active={filter === "pattern"} onPress={() => setFilter("pattern")} />
          <PillButton label="Not started" count={filterCounts.not_started} active={filter === "not_started"} onPress={() => setFilter("not_started")} />
          <PillButton label="Finished" count={filterCounts.finished} active={filter === "finished"} onPress={() => setFilter("finished")} />
        </PillRow>

        <View style={styles.controls}>
          <View style={styles.segment}>
            <SegmentButton label="Status" active={sortMode === "status"} onPress={() => setSortMode("status")} />
            <SegmentButton label="Start date" active={sortMode === "start_date"} onPress={() => setSortMode("start_date")} />
          </View>
          <View style={styles.segment}>
            <IconSegmentButton icon="grid-outline" active={viewMode === "grid"} onPress={() => setViewMode("grid")} />
            <IconSegmentButton icon="list-outline" active={viewMode === "list"} onPress={() => setViewMode("list")} />
          </View>
        </View>

        {filteredProjects.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>No projects yet</Text>
            <Text style={styles.emptyBody}>
              Projects keep planned skeins separate from your stash and build a single shopping list when you are short.
            </Text>
            <Pressable style={styles.emptyButton} onPress={() => router.push("/project/new")}>
              <Text style={styles.emptyButtonText}>New project</Text>
            </Pressable>
          </View>
        ) : viewMode === "grid" ? (
          <View style={styles.grid}>
            {filteredProjects.map((summary) => (
              <ProjectCard
                key={summary.project.id}
                summary={summary}
                variant="grid"
                onPress={() => router.push(`/project/${summary.project.id}`)}
              />
            ))}
          </View>
        ) : (
          <View style={styles.list}>
            {filteredProjects.map((summary) => (
              <ProjectCard
                key={summary.project.id}
                summary={summary}
                variant="list"
                onPress={() => router.push(`/project/${summary.project.id}`)}
              />
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

function compareByStatusThenDate(a: ProjectSummary, b: ProjectSummary): number {
  const rank = (status: ProjectStatus) =>
    status === "wip" ? 0 : status === "pattern" ? 1 : status === "not_started" ? 2 : 3;

  const rankDiff = rank(a.project.status) - rank(b.project.status);
  if (rankDiff !== 0) {
    return rankDiff;
  }

  const aDate = a.project.startDate ?? a.project.updatedAt;
  const bDate = b.project.startDate ?? b.project.updatedAt;
  return bDate.localeCompare(aDate);
}

function SegmentButton({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={[styles.segmentButton, active && styles.segmentButtonActive]}>
      <Text style={[styles.segmentLabel, active && styles.segmentLabelActive]}>{label}</Text>
    </Pressable>
  );
}

function IconSegmentButton({
  icon,
  active,
  onPress
}: {
  icon: keyof typeof Ionicons.glyphMap;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={[styles.iconSegment, active && styles.segmentButtonActive]}>
      <Ionicons name={icon} size={16} color={active ? colors.card : colors.ink2} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bg
  },
  scroll: {
    paddingHorizontal: spacing.lg
  },
  appbar: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: spacing.sm,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md
  },
  appbarGrow: {
    flex: 1
  },
  title: {
    fontFamily: font.serif,
    fontSize: 28,
    color: colors.ink,
    lineHeight: 32
  },
  subtitle: {
    fontFamily: font.sans,
    fontSize: 11,
    color: colors.ink3,
    marginTop: 3
  },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.rule,
    backgroundColor: colors.card,
    alignItems: "center",
    justifyContent: "center"
  },
  filterRow: {
    paddingBottom: spacing.md
  },
  controls: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
    paddingBottom: spacing.md
  },
  segment: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: colors.card2,
    borderWidth: 1,
    borderColor: colors.ruleSoft,
    borderRadius: radius.pill,
    padding: 4
  },
  segmentButton: {
    borderRadius: radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 7
  },
  segmentButtonActive: {
    backgroundColor: colors.ink
  },
  segmentLabel: {
    fontFamily: font.sansMedium,
    fontSize: 11,
    color: colors.ink2
  },
  segmentLabelActive: {
    color: colors.card
  },
  iconSegment: {
    width: 34,
    height: 30,
    borderRadius: radius.pill,
    alignItems: "center",
    justifyContent: "center"
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: spacing.md
  },
  list: {
    gap: spacing.md
  },
  emptyCard: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: colors.rule,
    borderRadius: radius.xl,
    padding: 24,
    alignItems: "center",
    gap: spacing.sm
  },
  emptyTitle: {
    fontFamily: font.serif,
    fontSize: 24,
    color: colors.ink
  },
  emptyBody: {
    fontFamily: font.sans,
    fontSize: 14,
    color: colors.ink3,
    textAlign: "center",
    lineHeight: 20
  },
  emptyButton: {
    marginTop: spacing.sm,
    backgroundColor: colors.accent,
    borderRadius: radius.md,
    paddingHorizontal: 16,
    paddingVertical: 11
  },
  emptyButtonText: {
    fontFamily: font.sansBold,
    fontSize: 13,
    color: colors.card
  }
});
