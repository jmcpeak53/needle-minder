import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ProjectImagePlaceholder } from "../../src/projects/components/ProjectImagePlaceholder";
import { ProjectStatusPill } from "../../src/projects/components/ProjectStatusPill";
import { ReservationRow } from "../../src/projects/components/ReservationRow";
import { useInventory } from "../../src/state/InventoryContext";
import { useProjects } from "../../src/state/ProjectsContext";
import { colors, font, spacing, radius } from "../../src/ui/theme";

export default function ProjectDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { getProjectDetail, updateProject, clearProjectReservations } = useProjects();
  const { inventory } = useInventory();
  const [tab, setTab] = useState<"overview" | "threads">("overview");

  const detail = useMemo(() => (id ? getProjectDetail(id) : null), [getProjectDetail, id]);

  const inventoryMap = useMemo(() => {
    const map = new Map();
    inventory.forEach((item) => {
      map.set(item.referenceColor.id, item);
    });
    return map;
  }, [inventory]);

  if (!detail) {
    return (
      <View style={[styles.screen, { paddingTop: insets.top }]}>
        <View style={styles.appbar}>
          <Pressable onPress={() => router.back()}>
            <Text style={styles.back}>Back</Text>
          </Pressable>
        </View>
        <Text style={styles.emptyTitle}>Project not found</Text>
      </View>
    );
  }

  const finishProject = async () => {
    if (detail.shortfallSkeins > 0) return;
    Alert.alert(
      "Finish project?",
      "Finishing this project deducts its reserved skeins from your stash. This cannot be undone in this version.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Finish",
          onPress: async () => {
            try {
              await updateProject(detail.project.id, {
                folder: detail.project.folder,
                name: detail.project.name,
                author: detail.project.author,
                canvasMesh: detail.project.canvasMesh,
                status: "finished",
                startDate: detail.project.startDate,
                completedDate: detail.project.completedDate,
                imageUri: detail.project.imageUri,
                notes: detail.project.notes
              });
            } catch (error) {
              Alert.alert("Could not finish project", error instanceof Error ? error.message : "Please try again.");
            }
          }
        }
      ]
    );
  };

  const clearAll = async () => {
    Alert.alert("Clear reserved threads?", "This removes every reserved color from the project.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Clear",
        style: "destructive",
        onPress: async () => {
          await clearProjectReservations(detail.project.id);
        }
      }
    ]);
  };

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <View style={styles.appbar}>
        <Pressable onPress={() => router.back()}>
          <Text style={styles.back}>Back</Text>
        </Pressable>
        <View style={styles.appbarActions}>
          <Pressable style={styles.iconBtn} onPress={() => router.push(`/project/${detail.project.id}/edit`)}>
            <Ionicons name="create-outline" size={18} color={colors.ink2} />
          </Pressable>
          <Pressable style={styles.iconBtn} onPress={() => router.push(`/project/${detail.project.id}/threads`)}>
            <Ionicons name="add" size={18} color={colors.ink2} />
          </Pressable>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <View style={styles.heroImage}>
            <ProjectImagePlaceholder imageUri={detail.project.imageUri} rounded={radius.xl} />
          </View>
          <View style={styles.heroOverlay}>
            <ProjectStatusPill status={detail.project.status} />
            <Text style={styles.heroTitle}>{detail.project.name}</Text>
            <Text style={styles.heroMeta}>{detail.project.folder ?? "Root"}{detail.project.author ? ` · ${detail.project.author}` : ""}</Text>
          </View>
        </View>

        <View style={styles.statGrid}>
          <StatCard label="Colors" value={detail.totalColors} />
          <StatCard label="Needed" value={detail.totalSkeins} />
          <StatCard label={detail.shortfallSkeins > 0 ? "Still need" : "Ready"} value={detail.shortfallSkeins > 0 ? detail.shortfallSkeins : detail.readyColors} warn={detail.shortfallSkeins > 0} />
          <StatCard label="WIP days" value={detail.daysInWip ?? 0} />
        </View>

        <View style={styles.tabs}>
          <TabButton label="Overview" active={tab === "overview"} onPress={() => setTab("overview")} />
          <TabButton label={`Threads (${detail.totalColors})`} active={tab === "threads"} onPress={() => setTab("threads")} />
        </View>

        {tab === "overview" ? (
          <>
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Project notes</Text>
              <Text style={styles.cardText}>{detail.project.notes || "No notes yet."}</Text>
            </View>

            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Dates</Text>
              <MetaRow label="Started" value={detail.project.startDate ?? "Not set"} />
              <MetaRow label="Completed" value={detail.project.completedDate ?? "Not set"} />
            </View>

            {detail.project.status !== "finished" ? (
              <Pressable disabled={detail.shortfallSkeins > 0} style={[styles.actionButton, detail.shortfallSkeins > 0 && styles.actionButtonDisabled]} onPress={finishProject}>
                <Text style={styles.actionButtonText}>Finish project</Text>
              </Pressable>
            ) : (
              <View style={styles.finishedBanner}>
                <Ionicons name="checkmark-circle-outline" size={16} color={colors.ok} />
                <Text style={styles.finishedBannerText}>
                  Finished {detail.project.completedDate ?? "today"}. Reserved skeins have been deducted from stash.
                </Text>
              </View>
            )}
          </>
        ) : (
          <View style={styles.threadSection}>
            <View style={styles.threadActions}>
              <Pressable style={styles.secondaryButton} onPress={() => router.push(`/project/${detail.project.id}/threads`)}>
                <Text style={styles.secondaryButtonText}>Add threads</Text>
              </Pressable>
              {detail.reservations.length > 0 ? (
                <Pressable style={styles.secondaryButton} onPress={clearAll}>
                  <Text style={styles.secondaryButtonText}>Clear all</Text>
                </Pressable>
              ) : null}
            </View>

            {detail.reservations.length === 0 ? (
              <View style={styles.card}>
                <Text style={styles.cardText}>No thread reservations yet. Add the colors this project needs and the app will show what is already in stash and what still needs to be bought.</Text>
              </View>
            ) : (
              detail.reservations.map((reservation) => {
                const stashItem = inventoryMap.get(reservation.referenceColorId);
                return (
                  <ReservationRow
                    key={reservation.id}
                    reservation={reservation}
                    onPress={stashItem ? () => router.push(`/detail/${stashItem.referenceColor.id}`) : undefined}
                  />
                );
              })
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

function TabButton({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={[styles.tabButton, active && styles.tabButtonActive]}>
      <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>{label}</Text>
    </Pressable>
  );
}

function StatCard({ label, value, warn = false }: { label: string; value: number; warn?: boolean }) {
  return (
    <View style={styles.statCard}>
      <Text style={[styles.statValue, warn && styles.statValueWarn]}>{value}</Text>
      <Text style={[styles.statLabel, warn && styles.statLabelWarn]}>{label}</Text>
    </View>
  );
}

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.metaRow}>
      <Text style={styles.metaLabel}>{label}</Text>
      <Text style={styles.metaValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bg,
    paddingHorizontal: spacing.lg
  },
  appbar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: spacing.md
  },
  back: {
    fontFamily: font.sansMedium,
    fontSize: 13,
    color: colors.ink2
  },
  appbarActions: {
    flexDirection: "row",
    gap: spacing.sm
  },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.rule,
    backgroundColor: colors.card
  },
  scroll: {
    paddingBottom: 32,
    gap: spacing.md
  },
  hero: {
    height: 260,
    borderRadius: radius.xl,
    overflow: "hidden",
    backgroundColor: colors.card
  },
  heroImage: {
    ...StyleSheet.absoluteFillObject
  },
  heroOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    padding: spacing.lg,
    gap: 6,
    backgroundColor: "rgba(29,26,22,0.18)"
  },
  heroTitle: {
    fontFamily: font.serif,
    fontSize: 28,
    color: colors.card,
    lineHeight: 30
  },
  heroMeta: {
    fontFamily: font.sans,
    fontSize: 12,
    color: "rgba(250,246,236,0.92)"
  },
  statGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm
  },
  statCard: {
    width: "48.3%",
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.ruleSoft,
    borderRadius: radius.lg,
    padding: spacing.md
  },
  statValue: {
    fontFamily: font.serif,
    fontSize: 28,
    color: colors.ink,
    lineHeight: 28
  },
  statValueWarn: {
    color: colors.accent
  },
  statLabel: {
    fontFamily: font.sans,
    fontSize: 11,
    color: colors.ink3,
    marginTop: 6
  },
  statLabelWarn: {
    color: colors.accent
  },
  tabs: {
    flexDirection: "row",
    gap: 8,
    backgroundColor: colors.card2,
    borderWidth: 1,
    borderColor: colors.ruleSoft,
    borderRadius: radius.pill,
    padding: 4
  },
  tabButton: {
    flex: 1,
    borderRadius: radius.pill,
    paddingVertical: 9,
    alignItems: "center"
  },
  tabButtonActive: {
    backgroundColor: colors.ink
  },
  tabLabel: {
    fontFamily: font.sansMedium,
    fontSize: 12,
    color: colors.ink2
  },
  tabLabelActive: {
    color: colors.card
  },
  card: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.rule,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.sm
  },
  sectionTitle: {
    fontFamily: font.serif,
    fontSize: 18,
    color: colors.ink
  },
  cardText: {
    fontFamily: font.sans,
    fontSize: 14,
    color: colors.ink3,
    lineHeight: 20
  },
  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: spacing.sm
  },
  metaLabel: {
    fontFamily: font.sans,
    fontSize: 12,
    color: colors.ink3
  },
  metaValue: {
    fontFamily: font.mono,
    fontSize: 12,
    color: colors.ink
  },
  actionButton: {
    backgroundColor: colors.accent,
    borderRadius: radius.lg,
    alignItems: "center",
    paddingVertical: 14
  },
  actionButtonDisabled: {
    opacity: 0.75
  },
  actionButtonText: {
    fontFamily: font.sansBold,
    fontSize: 14,
    color: colors.card
  },
  finishedBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: colors.okSoft,
    borderRadius: radius.lg,
    paddingHorizontal: 14,
    paddingVertical: 12
  },
  finishedBannerText: {
    flex: 1,
    fontFamily: font.sans,
    fontSize: 12,
    color: colors.ok
  },
  threadSection: {
    gap: spacing.md
  },
  threadActions: {
    flexDirection: "row",
    gap: spacing.sm
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.rule,
    borderRadius: radius.md,
    alignItems: "center",
    paddingVertical: 12
  },
  secondaryButtonText: {
    fontFamily: font.sansMedium,
    fontSize: 13,
    color: colors.ink
  },
  emptyTitle: {
    fontFamily: font.serif,
    fontSize: 24,
    color: colors.ink
  }
});
