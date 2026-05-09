import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { buildReferenceColorSubtitle } from "../../../src/catalog/catalogBrowse";
import { buildCatalogFilterOptions, type CatalogFilter } from "../../../src/catalog/catalogFilter";
import { ProjectStatusPill } from "../../../src/projects/components/ProjectStatusPill";
import { buildVisibleProjectThreadColors } from "../../../src/projects/projectThreadSelection";
import { useNeedleMinder } from "../../../src/state/NeedleMinderContext";
import { PillButton, PillRow } from "../../../src/ui/PillButton";
import { colors, font, radius, spacing } from "../../../src/ui/theme";

export default function ProjectThreadsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const {
    catalog,
    threadTypes,
    defaultCatalogFilter,
    inventory,
    getProjectDetail,
    getReservationsByReferenceColor,
    setProjectReservation,
    removeProjectReservation
  } = useNeedleMinder();
  const [query, setQuery] = useState("");
  const [catalogFilter, setCatalogFilter] = useState<CatalogFilter>("all");

  const detail = useMemo(() => (id ? getProjectDetail(id) : null), [getProjectDetail, id]);
  const filterOptions = useMemo(() => buildCatalogFilterOptions(threadTypes), [threadTypes]);

  const visibleColors = useMemo(() => {
    if (!detail) {
      return [];
    }

    return buildVisibleProjectThreadColors({
      catalog,
      inventory,
      reservedColorIds: new Set(detail.reservations.map((item) => item.referenceColorId)),
      query,
      filter: catalogFilter
    });
  }, [catalog, catalogFilter, detail, inventory, query]);

  useEffect(() => {
    setCatalogFilter(defaultCatalogFilter);
  }, [defaultCatalogFilter]);

  if (!detail) {
    return (
      <View style={[styles.screen, { paddingTop: insets.top }]}>
        <Text style={styles.title}>Project not found</Text>
      </View>
    );
  }

  const quantities = new Map(detail.reservations.map((reservation) => [reservation.referenceColorId, reservation.quantity]));

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <View style={styles.appbar}>
        <Pressable onPress={() => router.back()}>
          <Text style={styles.back}>Back</Text>
        </Pressable>
        <Text style={styles.title}>Reserved threads</Text>
        <View style={styles.appbarSpacer} />
      </View>

      <View style={styles.projectBanner}>
        <View style={styles.projectBannerMeta}>
          <Text style={styles.projectName}>{detail.project.name}</Text>
          <Text style={styles.projectSub}>
            {detail.totalColors} colors · {detail.totalSkeins} needed
          </Text>
        </View>
        <ProjectStatusPill status={detail.project.status} />
      </View>

      <View style={styles.searchRow}>
        <Ionicons name="search-outline" size={16} color={colors.ink4} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search code, name, or family"
          placeholderTextColor={colors.ink4}
          style={styles.searchInput}
        />
      </View>

      <PillRow contentContainerStyle={styles.filterRow}>
        {filterOptions.map((option) => (
          <PillButton
            key={option.value}
            onPress={() => setCatalogFilter(option.value)}
            active={catalogFilter === option.value}
            label={option.label}
          />
        ))}
      </PillRow>

      <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
        {visibleColors.map((color) => {
          const projectQuantity = quantities.get(color.id) ?? 0;
          const lookup = getReservationsByReferenceColor(color.id);
          const reserved = lookup.filter((item) => item.project.status !== "finished").reduce((sum, item) => sum + item.quantity, 0);
          const stash = inventory
            .filter((item) => item.referenceColor.id === color.id)
            .reduce((sum, item) => sum + item.quantity, 0);
          const available = stash - reserved;

          return (
            <View key={color.id} style={styles.row}>
              <View style={styles.rowMeta}>
                <Text style={styles.rowName}>{color.colorName}</Text>
                <Text style={styles.rowSub}>
                  {color.colorCode} · {buildReferenceColorSubtitle(color, {
                    filter: catalogFilter,
                    catalog,
                    threadTypes
                  })}
                </Text>
                <Text style={[styles.rowHealth, available < 0 && styles.rowHealthWarn]}>
                  In stash {stash} · Reserved {reserved} · Available {available}
                </Text>
              </View>

              <View style={styles.stepper}>
                <Pressable
                  style={[styles.stepBtn, styles.stepBtnDark]}
                  onPress={async () => {
                    if (projectQuantity <= 1) {
                      await removeProjectReservation(detail.project.id, color.id);
                      return;
                    }
                    await setProjectReservation(detail.project.id, color.id, projectQuantity - 1);
                  }}
                >
                  <Ionicons name="remove" size={15} color={colors.card} />
                </Pressable>
                <Text style={styles.stepValue}>{projectQuantity}</Text>
                <Pressable
                  style={styles.stepBtn}
                  onPress={() => setProjectReservation(detail.project.id, color.id, projectQuantity + 1)}
                >
                  <Ionicons name="add" size={15} color={colors.ink} />
                </Pressable>
              </View>
            </View>
          );
        })}

        {visibleColors.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>No colors found</Text>
            <Text style={styles.emptyBody}>Search the catalog by color number, family, or thread name.</Text>
          </View>
        ) : null}
      </ScrollView>
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
  title: {
    fontFamily: font.serif,
    fontSize: 24,
    color: colors.ink
  },
  appbarSpacer: {
    width: 40
  },
  projectBanner: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.rule,
    borderRadius: radius.lg,
    padding: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm
  },
  projectBannerMeta: {
    flex: 1
  },
  projectName: {
    fontFamily: font.serif,
    fontSize: 22,
    color: colors.ink
  },
  projectSub: {
    fontFamily: font.sans,
    fontSize: 12,
    color: colors.ink3,
    marginTop: 2
  },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.rule,
    borderRadius: radius.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginTop: spacing.md
  },
  searchInput: {
    flex: 1,
    fontFamily: font.sans,
    fontSize: 14,
    color: colors.ink
  },
  filterRow: {
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm
  },
  list: {
    paddingVertical: spacing.md,
    gap: spacing.sm,
    paddingBottom: 32
  },
  row: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.ruleSoft,
    borderRadius: radius.lg,
    padding: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm
  },
  rowMeta: {
    flex: 1,
    minWidth: 0
  },
  rowName: {
    fontFamily: font.sansSemiBold,
    fontSize: 14,
    color: colors.ink
  },
  rowSub: {
    fontFamily: font.mono,
    fontSize: 11,
    color: colors.ink3,
    marginTop: 2
  },
  rowHealth: {
    fontFamily: font.sans,
    fontSize: 11,
    color: colors.ok,
    marginTop: 6
  },
  rowHealthWarn: {
    color: colors.accent
  },
  stepper: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: colors.card2,
    borderWidth: 1,
    borderColor: colors.ruleSoft,
    borderRadius: radius.md,
    padding: 2
  },
  stepBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center"
  },
  stepBtnDark: {
    backgroundColor: colors.ink
  },
  stepValue: {
    minWidth: 34,
    textAlign: "center",
    fontFamily: font.serif,
    fontSize: 22,
    color: colors.ink
  },
  emptyCard: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: colors.rule,
    borderRadius: radius.lg,
    padding: 20,
    alignItems: "center",
    gap: spacing.sm
  },
  emptyTitle: {
    fontFamily: font.serif,
    fontSize: 22,
    color: colors.ink
  },
  emptyBody: {
    fontFamily: font.sans,
    fontSize: 13,
    color: colors.ink3,
    textAlign: "center"
  }
});
