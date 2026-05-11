import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Animated, BackHandler, FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { buildCatalogBrowseResults, buildReferenceColorSubtitle } from "../../src/catalog/catalogBrowse";
import { buildCatalogFilterOptions, type CatalogFilter } from "../../src/catalog/catalogFilter";
import { useCatalog } from "../../src/state/CatalogContext";
import { useInventory } from "../../src/state/InventoryContext";
import { AppBar, AppBarAction } from "../../src/ui/AppBar";
import { InventoryForm } from "../../src/ui/InventoryForm";
import { KeyboardAwareBody } from "../../src/ui/KeyboardAwareBody";
import { PillButton, PillRow } from "../../src/ui/PillButton";
import { SearchFieldRow } from "../../src/ui/SearchFieldRow";
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
  const { ready, catalog, threadTypes, defaultCatalogFilter, getThreadTypeById } = useCatalog();
  const { addInventory } = useInventory();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [query, setQuery] = useState("");
  const [catalogFilter, setCatalogFilter] = useState<CatalogFilter>("all");
  const [selectedFamily, setSelectedFamily] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState<ReferenceColor | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [condition, setCondition] = useState<ThreadCondition>("full");
  const [favorite, setFavorite] = useState(false);
  const [notes, setNotes] = useState("");
  const [savedToast, setSavedToast] = useState<string | null>(null);
  const toastAnim = useRef(new Animated.Value(0)).current;
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  const dismissToast = useCallback(() => {
    Animated.timing(toastAnim, { toValue: 0, duration: 200, useNativeDriver: true }).start(() =>
      setSavedToast(null)
    );
  }, [toastAnim]);

  const showToast = useCallback((message: string) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setSavedToast(message);
    Animated.spring(toastAnim, { toValue: 1, useNativeDriver: true, tension: 80, friction: 10 }).start();
    toastTimer.current = setTimeout(dismissToast, 2500);
  }, [toastAnim, dismissToast]);

  useEffect(() => {
    return () => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
    };
  }, []);

  const resetSearchState = useCallback(() => {
    setQuery("");
    setSelectedFamily(null);
    setSelectedColor(null);
    setCatalogFilter(defaultCatalogFilter);
  }, [defaultCatalogFilter]);

  useFocusEffect(useCallback(() => {
    return () => {
      resetSearchState();
    };
  }, [resetSearchState]));

  function handleBack() {
    if (mode === "family") {
      setSelectedFamily(null);
    } else {
      router.back();
    }
  }

  const handleSave = useCallback(async () => {
    if (!selectedColor) return;
    const manufacturer = getThreadTypeById(selectedColor.threadTypeId)?.manufacturer ?? "";
    const label = manufacturer
      ? `Added ${manufacturer} ${selectedColor.colorCode} · ${selectedColor.colorName}`
      : `Added ${selectedColor.colorCode} · ${selectedColor.colorName}`;
    await addInventory({ referenceColorId: selectedColor.id, quantity, condition, favorite, notes });
    setSelectedColor(null);
    setQuantity(1);
    setCondition("full");
    setFavorite(false);
    setNotes("");
    setQuery("");
    setSelectedFamily(null);
    setCatalogFilter(defaultCatalogFilter);
    showToast(label);
  }, [selectedColor, quantity, condition, favorite, notes, addInventory, defaultCatalogFilter, getThreadTypeById, showToast]);

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

  const selectedCard = useMemo(() => {
    if (!selectedColor) return null;
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
          <AppBarAction icon="close" onPress={() => setSelectedColor(null)} size={16} color={colors.ink3} />
        </View>

        <InventoryForm
          quantity={quantity}
          onQuantityChange={setQuantity}
          condition={condition}
          onConditionChange={setCondition}
          favorite={favorite}
          onFavoriteChange={setFavorite}
          notes={notes}
          onNotesChange={setNotes}
        />

        <Pressable style={styles.saveBtn} onPress={handleSave}>
          <Text style={styles.saveBtnText}>Save to stash</Text>
          <Ionicons name="checkmark" size={16} color={colors.card} />
        </Pressable>
      </View>
    );
  }, [selectedColor, quantity, condition, favorite, notes, catalogFilter, catalog, threadTypes, handleSave]);

  const listHeader = useMemo(() => (
    <>
      <SearchFieldRow
        value={query}
        onChangeText={setQuery}
        placeholder="Search by number, name, or family…"
        autoFocus
        containerStyle={styles.searchRow}
        inputTestID="add-search-input"
        clearButtonTestID="add-search-clear-button"
      />

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

      {selectedCard}
    </>
  ), [query, filterOptions, catalogFilter, selectedCard]);

  const listContentStyle = useMemo(
    () => [styles.scroll, { paddingBottom: insets.bottom + 24 }],
    [insets.bottom]
  );
  const listKeyboardDismissMode = selectedColor ? "none" : "on-drag";

  if (!ready) return <View style={[styles.screen, { paddingTop: insets.top }]} />;

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <AppBar
        title={mode === "family" ? selectedFamily ?? "Add manually" : "Add manually"}
        onBack={handleBack}
      />

      <KeyboardAwareBody scroll={false} testID="add-keyboard-body">
        {mode === "browse" ? (
          <FlatList
            data={families}
            keyExtractor={keyExtractorFamily}
            renderItem={renderFamilyRow}
            keyboardDismissMode={listKeyboardDismissMode}
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
            keyboardDismissMode={listKeyboardDismissMode}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={listContentStyle}
            ListHeaderComponent={listHeader}
          />
        )}
      </KeyboardAwareBody>

      {savedToast !== null && (
        <Animated.View
          style={[
            styles.savedToast,
            { bottom: insets.bottom + 90 },
            { opacity: toastAnim, transform: [{ translateY: toastAnim.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) }] }
          ]}
        >
          <Ionicons name="checkmark" size={16} color={colors.card} />
          <Text style={styles.savedToastMsg} numberOfLines={1}>{savedToast}</Text>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  searchRow: {
    marginBottom: spacing.sm
  },
  filterRow: {
    paddingBottom: spacing.sm
  },
  scroll: { paddingHorizontal: spacing.lg },
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
  resultFamily: { fontFamily: font.sans, fontSize: 12, color: colors.ink3, marginTop: 1 },
  savedToast: {
    position: "absolute",
    left: 14,
    right: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: colors.ink,
    borderRadius: radius.md,
    paddingVertical: 12,
    paddingHorizontal: 14,
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 4
  },
  savedToastMsg: {
    flex: 1,
    fontFamily: font.sans,
    fontSize: 13,
    color: colors.card
  }
});
