import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { BackHandler, FlatList, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { buildCatalogBrowseResults, buildReferenceColorSubtitle } from "../../src/catalog/catalogBrowse";
import { buildCatalogFilterOptions, type CatalogFilter } from "../../src/catalog/catalogFilter";
import { useCatalog } from "../../src/state/CatalogContext";
import { useInventory } from "../../src/state/InventoryContext";
import { InventoryForm } from "../../src/ui/InventoryForm";
import { PillButton, PillRow } from "../../src/ui/PillButton";
import { SkeinBall } from "../../src/ui/SkeinBall";
import { colors, font, radius, spacing } from "../../src/ui/theme";
import type { CatalogFamilySummary } from "../../src/catalog/catalogBrowse";
import type { ReferenceColor, ThreadCondition } from "../../src/types";

function RainbowBall({ size }: { size: number }) {
  const stripes = ["#E53935", "#FB8C00", "#FDD835", "#43A047", "#1E88E5", "#8E24AA"];
  const stripeW = Math.ceil(size / stripes.length);
  const r = size / 2;
  return (
    <View style={{ width: size, height: size, borderRadius: r, overflow: "hidden", flexDirection: "row", flexShrink: 0 }}>
      {stripes.map((color, i) => (
        <View key={i} style={{ width: stripeW, height: size, backgroundColor: color }} />
      ))}
      <View style={{ position: "absolute", width: size * 0.42, height: size * 0.3, borderRadius: size * 0.15, top: size * 0.12, left: size * 0.14, backgroundColor: "rgba(255,255,255,0.32)", transform: [{ rotate: "-20deg" }] }} />
      <View style={{ position: "absolute", width: size * 0.5, height: size * 0.36, borderRadius: size * 0.18, bottom: size * 0.1, right: size * 0.08, backgroundColor: "rgba(0,0,0,0.18)", transform: [{ rotate: "-15deg" }] }} />
    </View>
  );
}

function keyExtractorFamily(item: CatalogFamilySummary) {
  return item.name;
}

function keyExtractorResult(item: ReferenceColor) {
  return item.id;
}

export default function AddScreen() {
  const { ready, catalog, threadTypes, defaultCatalogFilter } = useCatalog();
  const { addInventory } = useInventory();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState("");
  const [catalogFilter, setCatalogFilter] = useState<CatalogFilter>("all");
  const [selectedFamily, setSelectedFamily] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState<ReferenceColor | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [condition, setCondition] = useState<ThreadCondition>("full");
  const [notes, setNotes] = useState("");

  const isSearching = query.trim().length > 0;
  const mode = isSearching ? "search" : selectedFamily ? "family" : "browse";

  const filterOptions = useMemo(() => buildCatalogFilterOptions(threadTypes), [threadTypes]);
  const { families, results } = useMemo(
    () =>
      buildCatalogBrowseResults({
        catalog,
        filter: catalogFilter,
        query,
        selectedFamily
      }),
    [catalog, catalogFilter, query, selectedFamily]
  );

  useEffect(() => {
    const subscription = BackHandler.addEventListener("hardwareBackPress", () => {
      if (mode === "family") {
        setSelectedFamily(null);
        return true;
      }
      return false;
    });
    return () => subscription.remove();
  }, [mode]);

  useEffect(() => {
    setCatalogFilter(defaultCatalogFilter);
  }, [defaultCatalogFilter]);

  function handleBack() {
    if (mode === "family") {
      setSelectedFamily(null);
    } else {
      router.back();
    }
  }

  const handleSave = useCallback(async () => {
    if (!selectedColor) return;
    await addInventory({ referenceColorId: selectedColor.id, quantity, condition, notes });
    setSelectedColor(null);
    setQuantity(1);
    setCondition("full");
    setNotes("");
    router.back();
  }, [selectedColor, quantity, condition, notes, addInventory, router]);

  const renderFamilyRow = useCallback(({ item: family }: { item: CatalogFamilySummary }) => (
    <Pressable
      style={styles.familyRow}
      onPress={() => setSelectedFamily(family.name)}
    >
      {family.isRainbow
        ? <RainbowBall size={28} />
        : <SkeinBall color={family.representativeHex} size={28} />
      }
      <Text style={styles.familyName}>{family.name}</Text>
      <Text style={styles.familyCount}>{family.count}</Text>
      <Ionicons name="chevron-forward" size={14} color={colors.ink4} />
    </Pressable>
  ), []);

  const renderResultRow = useCallback(({ item: color }: { item: ReferenceColor }) => (
    <Pressable
      onPress={() => setSelectedColor(color)}
      style={[
        styles.resultRow,
        selectedColor?.id === color.id && styles.resultRowSelected
      ]}
    >
      <SkeinBall color={color.hexRgb} size={40} />
      <View style={{ flex: 1 }}>
        <Text style={styles.resultName}>
          {color.colorCode}{" "}
          <Text style={styles.resultColorName}>{color.colorName}</Text>
        </Text>
        {mode === "search" && (
          <Text style={styles.resultFamily}>
            {buildReferenceColorSubtitle(color, { filter: catalogFilter, catalog, threadTypes })}
          </Text>
        )}
      </View>
      <Ionicons name="chevron-forward" size={14} color={colors.ink4} />
    </Pressable>
  ), [selectedColor, mode, catalogFilter, catalog, threadTypes]);

  const listHeader = useMemo(() => {
    if (!selectedColor) return undefined;
    return (
      <View style={styles.selectedCard}>
        <View style={styles.selectedHeader}>
          <SkeinBall color={selectedColor.hexRgb} size={52} />
          <View style={{ flex: 1 }}>
            <Text style={styles.selectedName}>{selectedColor.colorName}</Text>
            <Text style={styles.selectedCode}>
              {selectedColor.colorCode} · {buildReferenceColorSubtitle(selectedColor, {
                filter: catalogFilter,
                catalog,
                threadTypes
              })}
            </Text>
          </View>
          <Pressable onPress={() => setSelectedColor(null)} style={styles.iconBtn}>
            <Ionicons name="close" size={16} color={colors.ink3} />
          </Pressable>
        </View>

        <InventoryForm
          quantity={quantity}
          onQuantityChange={setQuantity}
          condition={condition}
          onConditionChange={setCondition}
          notes={notes}
          onNotesChange={setNotes}
        />

        <Pressable style={styles.saveBtn} onPress={handleSave}>
          <Text style={styles.saveBtnText}>Save to stash</Text>
          <Ionicons name="checkmark" size={16} color={colors.card} />
        </Pressable>
      </View>
    );
  }, [selectedColor, quantity, condition, notes, catalogFilter, catalog, threadTypes, handleSave]);

  const listContentStyle = useMemo(
    () => [styles.scroll, { paddingBottom: insets.bottom + 24 }],
    [insets.bottom]
  );

  if (!ready) return <View style={[styles.screen, { paddingTop: insets.top }]} />;

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      {/* App bar */}
      <View style={styles.appbar}>
        <Pressable onPress={handleBack} style={styles.iconBtn}>
          <Ionicons name="chevron-back" size={18} color={colors.ink2} />
        </Pressable>
        <Text style={styles.appbarTitle} numberOfLines={1}>
          {mode === "family" ? selectedFamily : "Add manually"}
        </Text>
      </View>

      {/* Search */}
      <View style={styles.searchWrap}>
        <View style={styles.searchRow}>
          <Ionicons name="search-outline" size={16} color={colors.ink4} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search by number, name, or family…"
            placeholderTextColor={colors.ink3}
            style={styles.searchInput}
            autoFocus
          />
          {query.length > 0 && (
            <Pressable onPress={() => setQuery("")}>
              <Ionicons name="close-circle" size={16} color={colors.ink4} />
            </Pressable>
          )}
        </View>
      </View>

      <PillRow contentContainerStyle={styles.filterRow}>
        {filterOptions.map((option) => (
          <PillButton
            key={option.value}
            onPress={() => {
              setCatalogFilter(option.value);
              setSelectedFamily(null);
              setSelectedColor(null);
            }}
            active={catalogFilter === option.value}
            label={option.label}
          />
        ))}
      </PillRow>

      {mode === "browse" ? (
        <FlatList
          data={families}
          keyExtractor={keyExtractorFamily}
          renderItem={renderFamilyRow}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={listContentStyle}
          ListHeaderComponent={listHeader}
        />
      ) : (
        <FlatList
          data={results}
          keyExtractor={keyExtractorResult}
          renderItem={renderResultRow}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={listContentStyle}
          ListHeaderComponent={listHeader}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  appbar: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md
  },
  appbarTitle: {
    fontFamily: font.serif,
    fontSize: 22,
    color: colors.ink,
    flex: 1
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center"
  },
  searchWrap: { paddingHorizontal: spacing.lg, paddingBottom: spacing.sm },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: colors.card2,
    borderWidth: 1,
    borderColor: colors.ruleSoft,
    borderRadius: radius.md,
    paddingHorizontal: 12,
    paddingVertical: 9
  },
  searchInput: {
    flex: 1,
    fontFamily: font.sans,
    fontSize: 13,
    color: colors.ink
  },
  filterRow: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm
  },
  scroll: { paddingHorizontal: spacing.lg },
  // Family browse
  familyRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.ruleSoft
  },
  familyName: {
    flex: 1,
    fontFamily: font.sansMedium,
    fontSize: 15,
    color: colors.ink
  },
  familyCount: {
    fontFamily: font.mono,
    fontSize: 12,
    color: colors.ink3
  },
  // Selected card
  selectedCard: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.rule,
    borderRadius: radius.xl,
    padding: spacing.md,
    marginBottom: spacing.md,
    gap: spacing.md
  },
  selectedHeader: { flexDirection: "row", alignItems: "center", gap: 12 },
  selectedName: { fontFamily: font.sansSemiBold, fontSize: 16, color: colors.ink },
  selectedCode: { fontFamily: font.mono, fontSize: 11, color: colors.ink3, marginTop: 2 },
  saveBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: colors.ink,
    borderRadius: radius.md,
    paddingVertical: 12
  },
  saveBtnText: { fontFamily: font.sansSemiBold, fontSize: 14, color: colors.card },
  // Color results (family drill-down + search)
  resultRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.ruleSoft
  },
  resultRowSelected: { opacity: 0.5 },
  resultName: { fontFamily: font.mono, fontSize: 13, color: colors.ink3 },
  resultColorName: { fontFamily: font.sansMedium, fontSize: 14, color: colors.ink },
  resultFamily: { fontFamily: font.sans, fontSize: 12, color: colors.ink3, marginTop: 1 }
});
