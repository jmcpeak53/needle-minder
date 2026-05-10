import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { InventoryNotesEditor } from "../../src/inventory/components/InventoryNotesEditor";
import { ProjectStatusPill } from "../../src/projects/components/ProjectStatusPill";
import { useCatalog } from "../../src/state/CatalogContext";
import { useInventory } from "../../src/state/InventoryContext";
import { useProjects } from "../../src/state/ProjectsContext";
import { SkeinBall } from "../../src/ui/SkeinBall";
import { ThreadConditionPill } from "../../src/ui/ThreadConditionPill";
import { colors, font, radius, spacing } from "../../src/ui/theme";

export default function DetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { inventory, decrementInventory, updateInventory, toggleFavorite, removeInventory } = useInventory();
  const { getReservationsByReferenceColor } = useProjects();
  const { getThreadTypeDisplayName } = useCatalog();

  const item = useMemo(() => inventory.find((inventoryItem) => inventoryItem.id === id) ?? null, [inventory, id]);
  const [noteDraft, setNoteDraft] = useState("");
  const lastSavedNoteRef = useRef("");
  const latestCommitRef = useRef<() => Promise<void>>(async () => undefined);
  const projectReservations = useMemo(
    () => (item ? getReservationsByReferenceColor(item.referenceColor.id) : []),
    [getReservationsByReferenceColor, item]
  );

  useEffect(() => {
    const nextNote = item?.notes ?? "";
    setNoteDraft(nextNote);
    lastSavedNoteRef.current = nextNote;
  }, [item?.id, item?.notes]);

  const commitNoteIfChanged = useCallback(async () => {
    if (!item) return;
    if (noteDraft === lastSavedNoteRef.current) return;

    const previousNote = lastSavedNoteRef.current;
    const nextNote = noteDraft;
    lastSavedNoteRef.current = nextNote;

    try {
      await updateInventory(item.id, { notes: nextNote });
    } catch (error) {
      lastSavedNoteRef.current = previousNote;
      Alert.alert("Could not save note", error instanceof Error ? error.message : "Please try again.");
    }
  }, [item, noteDraft, updateInventory]);

  latestCommitRef.current = commitNoteIfChanged;

  useEffect(() => {
    return () => {
      void latestCommitRef.current();
    };
  }, []);

  const handleDecrement = useCallback(async () => {
    if (!item) return;
    await commitNoteIfChanged();

    if (item.quantity <= 1) {
      Alert.alert("Remove skein?", `This is your last ${item.referenceColor.colorName}.`, [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            await removeInventory(item.id);
            router.back();
          }
        }
      ]);
      return;
    }

    await decrementInventory(item.id);
  }, [item, commitNoteIfChanged, decrementInventory, removeInventory, router]);

  const handleIncrement = useCallback(async () => {
    if (!item) return;
    await commitNoteIfChanged();
    await updateInventory(item.id, { quantity: item.quantity + 1 });
  }, [item, commitNoteIfChanged, updateInventory]);

  const handleToggleFavorite = useCallback(async () => {
    if (!item) return;
    await commitNoteIfChanged();
    await toggleFavorite(item.id);
  }, [item, commitNoteIfChanged, toggleFavorite]);

  const handleBack = useCallback(async () => {
    await commitNoteIfChanged();
    router.back();
  }, [commitNoteIfChanged, router]);

  const handleOpenProject = useCallback(async (projectId: string) => {
    await commitNoteIfChanged();
    router.push(`/project/${projectId}`);
  }, [commitNoteIfChanged, router]);

  if (!item) {
    return (
      <View style={[styles.screen, { paddingTop: insets.top }]}>
        <View style={styles.appbar}>
          <Pressable onPress={() => router.back()} style={styles.iconBtn}>
            <Ionicons name="chevron-back" size={18} color={colors.ink2} />
          </Pressable>
          <Text style={styles.appbarTitle}>Not found</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <View style={styles.appbar}>
        <Pressable onPress={() => void handleBack()} style={styles.iconBtn}>
          <Ionicons name="chevron-back" size={18} color={colors.ink2} />
        </Pressable>
        <View style={styles.appbarCenter}>
          <Text style={styles.appbarCode}>{item.referenceColor.colorCode}</Text>
          <Text style={styles.appbarName}>{item.referenceColor.colorName}</Text>
        </View>
        <Pressable
          style={styles.iconBtn}
          onPress={() =>
            Alert.alert("Remove from stash?", `${item.referenceColor.colorName} will be deleted.`, [
              { text: "Cancel", style: "cancel" },
              {
                text: "Remove",
                style: "destructive",
                onPress: async () => {
                  await removeInventory(item.id);
                  router.back();
                }
              }
            ])
          }
        >
          <Ionicons name="ellipsis-horizontal" size={18} color={colors.ink2} />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 24 }]}
        keyboardDismissMode="on-drag"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.hero}>
          <SkeinBall color={item.referenceColor.hexRgb} size={80} condition={item.condition} showConditionBadge />
          <View style={styles.heroInfo}>
            <Text style={styles.heroType}>{getThreadTypeDisplayName(item.referenceColor.threadTypeId)}</Text>
            <Text style={styles.heroMeta}>
              Added {formatDate(item.updatedAt)} · {item.referenceColor.colorFamily}
            </Text>
            <View style={styles.heroTags}>
              <View style={styles.heroCode}>
                <Text style={styles.heroCodeText}>{item.referenceColor.colorCode}</Text>
              </View>
              <ThreadConditionPill condition={item.condition} />
              <Pressable onPress={() => void handleToggleFavorite()} hitSlop={8}>
                <Ionicons
                  name={item.favorite ? "star" : "star-outline"}
                  size={16}
                  color={item.favorite ? "#e6a817" : colors.ink3}
                />
              </Pressable>
            </View>
          </View>
        </View>

        <View style={styles.countCard}>
          <Text style={styles.countValue}>
            <Text style={styles.countX}>×</Text>
            {item.quantity}
          </Text>
          <View style={styles.countCtrls}>
            <Pressable style={[styles.countBtn, styles.countBtnPrimary]} onPress={() => void handleDecrement()}>
              <Ionicons name="remove" size={20} color={colors.card} />
            </Pressable>
            <Pressable style={styles.countBtn} onPress={() => void handleIncrement()}>
              <Ionicons name="add" size={20} color={colors.ink} />
            </Pressable>
          </View>
        </View>

        <InventoryNotesEditor
          value={noteDraft}
          onChangeText={setNoteDraft}
          onBlur={() => void commitNoteIfChanged()}
        />

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>History</Text>
          <Text style={styles.sectionAction}>All activity</Text>
        </View>

        <View style={styles.histRow}>
          <View style={[styles.histPip, styles.histPipPlus]}>
            <Text style={[styles.histPipText, styles.histPipTextPlus]}>+{item.quantity}</Text>
          </View>
          <View style={styles.histMeta}>
            <Text style={styles.histTitle}>Added to stash</Text>
            <Text style={styles.histSub}>{item.condition === "full" ? "Full skeins" : "Partial"}</Text>
          </View>
          <Text style={styles.histDate}>{formatDate(item.updatedAt)}</Text>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Projects</Text>
          <Text style={styles.sectionAction}>
            {projectReservations.length} reservation{projectReservations.length === 1 ? "" : "s"}
          </Text>
        </View>

        {projectReservations.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyCardText}>No projects are reserving this color yet.</Text>
          </View>
        ) : (
          projectReservations.map((reservation) => (
            <Pressable
              key={reservation.project.id}
              onPress={() => void handleOpenProject(reservation.project.id)}
              style={styles.projectRow}
            >
              <View style={styles.projectMeta}>
                <Text style={styles.projectName}>{reservation.project.name}</Text>
                <Text style={styles.projectSub}>
                  Need {reservation.quantity} · In stash {reservation.physicalStash} · Reserved {reservation.reserved}
                </Text>
                {reservation.stillNeed > 0 ? (
                  <Text style={styles.projectWarn}>Still need {reservation.stillNeed}</Text>
                ) : null}
              </View>
              <View style={styles.projectRight}>
                <ProjectStatusPill status={reservation.project.status} />
              </View>
            </Pressable>
          ))
        )}
      </ScrollView>
    </View>
  );
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  } catch {
    return iso;
  }
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bg
  },
  appbar: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md
  },
  appbarCenter: {
    flex: 1
  },
  appbarCode: {
    fontFamily: font.sans,
    fontSize: 11,
    color: colors.ink3,
    letterSpacing: 0.2
  },
  appbarName: {
    fontFamily: font.serif,
    fontSize: 22,
    color: colors.ink,
    lineHeight: 24
  },
  appbarTitle: {
    flex: 1,
    fontFamily: font.serif,
    fontSize: 22,
    color: colors.ink
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center"
  },
  scroll: {
    paddingHorizontal: spacing.lg
  },
  hero: {
    flexDirection: "row",
    gap: 14,
    alignItems: "center",
    paddingVertical: spacing.md
  },
  heroInfo: {
    flex: 1
  },
  heroType: {
    fontFamily: font.serif,
    fontSize: 22,
    color: colors.ink,
    lineHeight: 24
  },
  heroMeta: {
    fontFamily: font.sans,
    fontSize: 12,
    color: colors.ink3,
    marginTop: 3
  },
  heroTags: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: spacing.sm,
    marginTop: 6
  },
  heroCode: {
    backgroundColor: colors.card2,
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    alignSelf: "flex-start"
  },
  heroCodeText: {
    fontFamily: font.mono,
    fontSize: 11,
    color: colors.ink3
  },
  countCard: {
    backgroundColor: colors.card2,
    borderWidth: 1,
    borderColor: colors.ruleSoft,
    borderRadius: 16,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.md
  },
  countValue: {
    fontFamily: font.serif,
    fontSize: 48,
    color: colors.ink,
    lineHeight: 48
  },
  countX: {
    color: colors.ink4,
    fontSize: 24,
    marginRight: 4
  },
  countCtrls: {
    flexDirection: "row",
    gap: 6
  },
  countBtn: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.rule,
    alignItems: "center",
    justifyContent: "center"
  },
  countBtnPrimary: {
    backgroundColor: colors.accent,
    borderColor: colors.accent
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
    paddingTop: 14,
    paddingBottom: 8
  },
  sectionTitle: {
    fontFamily: font.serif,
    fontSize: 18,
    color: colors.ink
  },
  sectionAction: {
    fontFamily: font.sans,
    fontSize: 11,
    color: colors.ink3,
    letterSpacing: 0.3
  },
  histRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.ruleSoft
  },
  histPip: {
    width: 24,
    height: 24,
    borderRadius: 8,
    backgroundColor: colors.card2,
    alignItems: "center",
    justifyContent: "center"
  },
  histPipPlus: {
    backgroundColor: "#e1ebdb"
  },
  histPipText: {
    fontFamily: font.mono,
    fontSize: 10,
    fontWeight: "600",
    color: colors.ink3
  },
  histPipTextPlus: {
    color: colors.ok
  },
  histMeta: {
    flex: 1
  },
  histTitle: {
    fontFamily: font.sans,
    fontSize: 13,
    color: colors.ink
  },
  histSub: {
    fontFamily: font.sans,
    fontSize: 11,
    color: colors.ink4,
    marginTop: 1
  },
  histDate: {
    fontFamily: font.mono,
    fontSize: 11,
    color: colors.ink4
  },
  emptyCard: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.ruleSoft,
    borderRadius: radius.lg,
    padding: spacing.md
  },
  emptyCardText: {
    fontFamily: font.sans,
    fontSize: 13,
    color: colors.ink3
  },
  projectRow: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.ruleSoft,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm
  },
  projectMeta: {
    flex: 1
  },
  projectName: {
    fontFamily: font.sansSemiBold,
    fontSize: 14,
    color: colors.ink
  },
  projectSub: {
    fontFamily: font.sans,
    fontSize: 11,
    color: colors.ink3,
    marginTop: 2
  },
  projectWarn: {
    fontFamily: font.sansMedium,
    fontSize: 11,
    color: colors.accent,
    marginTop: 6
  },
  projectRight: {
    alignItems: "flex-end"
  }
});
