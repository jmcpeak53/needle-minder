import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Modal,
  Pressable,
  SectionList,
  StyleSheet,
  Text,
  View
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useCatalog } from "../../src/state/CatalogContext";
import { useInventory } from "../../src/state/InventoryContext";
import { PillButton, PillRow } from "../../src/ui/PillButton";
import { SearchFieldRow } from "../../src/ui/SearchFieldRow";
import { SkeinBall } from "../../src/ui/SkeinBall";
import { ThreadConditionPill } from "../../src/ui/ThreadConditionPill";
import { colors, font, NAV_HEIGHT, radius, spacing } from "../../src/ui/theme";
import type { InventoryItem } from "../../src/types";

const SCREEN_W = Dimensions.get("window").width;
const SWATCH_GAP = 8;
const SWATCH_COLS = 4;
const SWATCH_PAD = spacing.lg * 2;
const SWATCH_SIZE = Math.floor((SCREEN_W - SWATCH_PAD - SWATCH_GAP * (SWATCH_COLS - 1)) / SWATCH_COLS);

type FilterKey = "all" | "low" | "favorites" | string; // threadTypeId

type SwatchRow = InventoryItem[];

type StashSection = {
  family: string;
  totalQty: number;
  data: SwatchRow[];
};

function keyExtractor(item: SwatchRow, index: number) {
  return item[0]?.id ?? `row-${index}`;
}

export default function StashScreen() {
  const { ready, inventory, updateInventory } = useInventory();
  const { getThreadTypeDisplayName } = useCatalog();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { filter: filterParam } = useLocalSearchParams<{ filter?: string }>();

  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<FilterKey>((filterParam as FilterKey) ?? "all");

  useEffect(() => {
    if (filterParam) setFilter(filterParam as FilterKey);
  }, [filterParam]);
  const [pressedItem, setPressedItem] = useState<InventoryItem | null>(null);
  const [sheetQty, setSheetQty] = useState(0);
  const [snackbar, setSnackbar] = useState<{
    message: string;
    item: InventoryItem;
    oldQty: number;
  } | null>(null);

  const snackTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const snackAnim = useRef(new Animated.Value(0)).current;

  const brandFilters = useMemo(() => {
    const map = new Map<string, number>();
    for (const item of inventory) {
      const key = item.referenceColor.threadTypeId;
      map.set(key, (map.get(key) ?? 0) + item.quantity);
    }
    return Array.from(map.entries()).map(([id, count]) => ({ id, count }));
  }, [inventory]);

  const lowCount = useMemo(() => inventory.filter((i) => i.quantity <= 2).length, [inventory]);
  const favoritesCount = useMemo(() => inventory.filter((i) => i.favorite).length, [inventory]);

  const filtered = useMemo(() => {
    let items = inventory;
    if (filter === "low") items = items.filter((i) => i.quantity <= 2);
    else if (filter === "favorites") items = items.filter((i) => i.favorite);
    else if (filter !== "all") items = items.filter((i) => i.referenceColor.threadTypeId === filter);

    if (query.trim()) {
      const q = query.trim().toLowerCase();
      items = items.filter(
        (i) =>
          i.referenceColor.colorCode.toLowerCase().includes(q) ||
          i.referenceColor.colorName.toLowerCase().includes(q) ||
          i.referenceColor.colorFamily.toLowerCase().includes(q)
      );
    }
    return items;
  }, [inventory, filter, query]);

  const sections = useMemo<StashSection[]>(() => {
    const map = new Map<string, InventoryItem[]>();
    for (const item of filtered) {
      const fam = item.referenceColor.colorFamily;
      if (!map.has(fam)) map.set(fam, []);
      map.get(fam)!.push(item);
    }
    return Array.from(map.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([family, items]) => {
        const rows: SwatchRow[] = [];
        for (let i = 0; i < items.length; i += SWATCH_COLS) {
          rows.push(items.slice(i, i + SWATCH_COLS));
        }
        return {
          family,
          totalQty: items.reduce((s, item) => s + item.quantity, 0),
          data: rows
        };
      });
  }, [filtered]);

  const totalFiltered = useMemo(() => filtered.reduce((s, i) => s + i.quantity, 0), [filtered]);

  const openSheet = useCallback((item: InventoryItem) => {
    setPressedItem(item);
    setSheetQty(item.quantity);
  }, []);

  const closeSheet = useCallback(() => setPressedItem(null), []);

  const dismissSnackbar = useCallback(() => {
    Animated.timing(snackAnim, { toValue: 0, duration: 200, useNativeDriver: true }).start(() =>
      setSnackbar(null)
    );
  }, [snackAnim]);

  const showSnackbar = useCallback(
    (message: string, item: InventoryItem, oldQty: number) => {
      if (snackTimer.current) clearTimeout(snackTimer.current);
      setSnackbar({ message, item, oldQty });
      Animated.spring(snackAnim, { toValue: 1, useNativeDriver: true, tension: 80, friction: 10 }).start();
      snackTimer.current = setTimeout(dismissSnackbar, 5000);
    },
    [snackAnim, dismissSnackbar]
  );

  const saveSheet = useCallback(async () => {
    if (!pressedItem) return;
    const oldQty = pressedItem.quantity;
    closeSheet();

    if (sheetQty === oldQty) return;

    await updateInventory(pressedItem.id, { quantity: sheetQty });

    const diff = oldQty - sheetQty;
    if (diff > 0) {
      showSnackbar(
        `Used ${diff} Ã— ${pressedItem.referenceColor.colorCode}${sheetQty <= 1 ? " Â· running low" : ""}`,
        pressedItem,
        oldQty
      );
    }
  }, [pressedItem, sheetQty, updateInventory, closeSheet, showSnackbar]);

  const undoSnackbar = useCallback(async () => {
    if (!snackbar) return;
    if (snackTimer.current) clearTimeout(snackTimer.current);
    await updateInventory(snackbar.item.id, { quantity: snackbar.oldQty });
    dismissSnackbar();
  }, [snackbar, updateInventory, dismissSnackbar]);

  const renderSwatchRow = useCallback(({ item: row }: { item: SwatchRow }) => (
    <View style={styles.swatchRow}>
      {row.map((item) => (
        <SwatchCell
          key={item.id}
          item={item}
          onPress={() => router.push(`/detail/${item.id}`)}
          onLongPress={() => openSheet(item)}
        />
      ))}
      {row.length < SWATCH_COLS && Array.from({ length: SWATCH_COLS - row.length }).map((_, i) => (
        <View key={`pad-${i}`} style={{ width: SWATCH_SIZE }} />
      ))}
    </View>
  ), [router, openSheet]);

  const renderSectionHeader = useCallback(({ section }: { section: StashSection }) => (
    <View style={styles.groupHead}>
      <Text style={styles.groupHeadTitle}>{section.family}</Text>
      <View style={styles.groupHeadRule} />
      <Text style={styles.groupHeadCount}>{section.totalQty}</Text>
    </View>
  ), []);

  const listHeader = useMemo(() => (
    <>
      <View style={styles.appbar}>
        <View style={styles.appbarGrow}>
          <Text style={styles.appbarTitle}>My stash</Text>
          <Text style={styles.appbarSub}>
            {totalFiltered} skeins Â· grid Â· color family
          </Text>
        </View>
        <Pressable style={styles.iconBtn}>
          <Ionicons name="options-outline" size={18} color={colors.ink2} />
        </Pressable>
        <Pressable style={styles.iconBtn}>
          <Ionicons name="ellipsis-horizontal" size={18} color={colors.ink2} />
        </Pressable>
      </View>

      <SearchFieldRow
        value={query}
        onChangeText={setQuery}
        placeholder="Search catalog or code…"
        containerStyle={styles.searchRow}
        inputTestID="stash-search-input"
        clearButtonTestID="stash-search-clear-button"
      />

      <PillRow contentContainerStyle={styles.filterRow}>
        <PillButton label="All" count={inventory.reduce((s, i) => s + i.quantity, 0)} active={filter === "all"} onPress={() => setFilter("all")} />
        {favoritesCount > 0 && (
          <PillButton label="Favorites" count={favoritesCount} active={filter === "favorites"} onPress={() => setFilter("favorites")} />
        )}
        {brandFilters.map(({ id, count }) => (
          <PillButton key={id} label={getThreadTypeDisplayName(id)} count={count} active={filter === id} onPress={() => setFilter(id)} />
        ))}
        {lowCount > 0 && (
          <PillButton label="Low" count={lowCount} active={filter === "low"} onPress={() => setFilter("low")} warn />
        )}
      </PillRow>
    </>
  ), [totalFiltered, query, inventory, filter, brandFilters, lowCount, favoritesCount, getThreadTypeDisplayName]);

  const emptyComponent = useMemo(() => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyTitle}>No matches</Text>
      <Text style={styles.emptyBody}>Try a different search or filter.</Text>
    </View>
  ), []);

  const contentStyle = useMemo(
    () => [styles.scroll, { paddingBottom: NAV_HEIGHT + 24 }],
    []
  );

  if (!ready) {
    return <View style={[styles.screen, { paddingTop: insets.top }]} />;
  }

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <SectionList
        sections={sections}
        keyExtractor={keyExtractor}
        renderItem={renderSwatchRow}
        renderSectionHeader={renderSectionHeader}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={contentStyle}
        ListHeaderComponent={listHeader}
        ListEmptyComponent={emptyComponent}
        stickySectionHeadersEnabled={false}
      />

      {/* Snackbar */}
      {snackbar && (
        <Animated.View
          style={[
            styles.snackbar,
            { bottom: NAV_HEIGHT + 12 },
            {
              opacity: snackAnim,
              transform: [{ translateY: snackAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }]
            }
          ]}
        >
          <Ionicons name="checkmark" size={18} color={colors.card} />
          <Text style={styles.snackbarMsg} numberOfLines={1}>{snackbar.message}</Text>
          <Pressable onPress={undoSnackbar}>
            <Text style={styles.snackbarUndo}>UNDO</Text>
          </Pressable>
        </Animated.View>
      )}

      {/* Long-press sheet */}
      <Modal
        visible={pressedItem !== null}
        transparent
        animationType="fade"
        onRequestClose={closeSheet}
      >
        <Pressable style={styles.sheetOverlay} onPress={closeSheet}>
          <Pressable style={[styles.sheetCard, { bottom: NAV_HEIGHT + 12 + insets.bottom }]} onPress={() => {}}>
            {pressedItem && (
              <>
                <View style={styles.sheetTop}>
                  <SkeinBall
                    color={pressedItem.referenceColor.hexRgb}
                    size={48}
                    condition={pressedItem.condition}
                    showConditionBadge
                  />
                  <View style={styles.sheetMeta}>
                    <Text style={styles.sheetName}>{pressedItem.referenceColor.colorName}</Text>
                    <Text style={styles.sheetSub}>
                      {pressedItem.referenceColor.colorCode} Â· {getThreadTypeDisplayName(pressedItem.referenceColor.threadTypeId)}
                    </Text>
                    <View style={styles.sheetCondition}>
                      <ThreadConditionPill condition={pressedItem.condition} />
                    </View>
                  </View>
                  <Text style={styles.sheetCurrentQty}>
                    <Text style={styles.sheetQtyX}>Ã—</Text>
                    {pressedItem.quantity}
                  </Text>
                </View>

                <View style={styles.sheetQtyRow}>
                  <Text style={styles.sheetQtyLabel}>Adjust quantity</Text>
                  <View style={styles.stepper}>
                    <Pressable
                      style={[styles.stepBtn, styles.stepBtnPrimary]}
                      onPress={() => setSheetQty((q) => Math.max(1, q - 1))}
                    >
                      <Ionicons name="remove" size={14} color={colors.card} />
                    </Pressable>
                    <Text style={styles.stepValue}>{sheetQty}</Text>
                    <Pressable
                      style={styles.stepBtn}
                      onPress={() => setSheetQty((q) => q + 1)}
                    >
                      <Ionicons name="add" size={14} color={colors.ink} />
                    </Pressable>
                  </View>
                </View>

                <View style={styles.sheetActions}>
                  <Pressable
                    style={[styles.actionBtn, styles.actionBtnGhost]}
                    onPress={() => {
                      closeSheet();
                      router.push(`/detail/${pressedItem.id}`);
                    }}
                  >
                    <Text style={styles.actionBtnTextGhost}>Open detail</Text>
                  </Pressable>
                  <Pressable style={[styles.actionBtn, styles.actionBtnPrimary]} onPress={saveSheet}>
                    <Text style={styles.actionBtnTextPrimary}>Save</Text>
                  </Pressable>
                </View>
              </>
            )}
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

function SwatchCell({
  item,
  onPress,
  onLongPress
}: {
  item: InventoryItem;
  onPress: () => void;
  onLongPress: () => void;
}) {
  const isLow = item.quantity <= 1;
  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      delayLongPress={400}
      style={[styles.swatch, { width: SWATCH_SIZE, height: SWATCH_SIZE }]}
    >
      <View style={styles.swatchBallWrap}>
        <SkeinBall
          color={item.referenceColor.hexRgb}
          size={Math.floor(SWATCH_SIZE * 0.55)}
          condition={item.condition}
          showConditionBadge
        />
      </View>
      <View style={[styles.swatchQtyBadge, isLow && styles.swatchQtyBadgeLow]}>
        <Text style={[styles.swatchQtyText, isLow && styles.swatchQtyTextLow]}>
          {item.quantity}
        </Text>
      </View>
      <View style={styles.swatchLabel}>
        <Text style={styles.swatchCode} numberOfLines={1}>{item.referenceColor.colorCode}</Text>
      </View>
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
    paddingBottom: spacing.sm
  },
  appbarGrow: {
    flex: 1
  },
  appbarTitle: {
    fontFamily: font.serif,
    fontSize: 28,
    color: colors.ink,
    lineHeight: 32
  },
  appbarSub: {
    fontFamily: font.sans,
    fontSize: 11,
    color: colors.ink3,
    marginTop: 2,
    letterSpacing: 0.2
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center"
  },
  searchRow: {
    marginBottom: spacing.sm
  },
  filterRow: {
    paddingBottom: 12
  },
  groupHead: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: spacing.sm,
    paddingTop: 16,
    paddingBottom: 8
  },
  groupHeadTitle: {
    fontFamily: font.serif,
    fontSize: 18,
    color: colors.ink
  },
  groupHeadRule: {
    flex: 1,
    height: 1,
    backgroundColor: colors.ruleSoft
  },
  groupHeadCount: {
    fontFamily: font.mono,
    fontSize: 10,
    color: colors.ink4
  },
  swatchRow: {
    flexDirection: "row",
    gap: SWATCH_GAP,
    marginBottom: 4
  },
  swatch: {
    borderRadius: radius.lg,
    overflow: "hidden",
    position: "relative",
    backgroundColor: colors.card2,
    borderWidth: 1,
    borderColor: colors.ruleSoft
  },
  swatchBallWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center"
  },
  swatchQtyBadge: {
    position: "absolute",
    top: 6,
    right: 6,
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "rgba(250,246,236,0.95)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 5
  },
  swatchQtyBadgeLow: {
    backgroundColor: colors.accent
  },
  swatchQtyText: {
    fontFamily: font.serif,
    fontSize: 14,
    color: colors.ink
  },
  swatchQtyTextLow: {
    color: colors.card
  },
  swatchLabel: {
    position: "absolute",
    left: 5,
    bottom: 5,
    backgroundColor: "rgba(250,246,236,0.92)",
    borderRadius: 6,
    paddingHorizontal: 5,
    paddingVertical: 2
  },
  swatchCode: {
    fontFamily: font.mono,
    fontSize: 10,
    fontWeight: "600",
    color: colors.ink,
    letterSpacing: 0.3
  },
  emptyState: {
    paddingTop: 48,
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
    fontSize: 14,
    color: colors.ink3
  },
  // Snackbar
  snackbar: {
    position: "absolute",
    left: 14,
    right: 14,
    backgroundColor: colors.ink,
    borderRadius: radius.lg,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    shadowColor: colors.ink,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 8
  },
  snackbarMsg: {
    flex: 1,
    fontFamily: font.sans,
    fontSize: 13,
    color: colors.card
  },
  snackbarUndo: {
    fontFamily: font.sansBold,
    fontSize: 13,
    color: "#e8c9a3",
    letterSpacing: 0.3
  },
  // Long-press sheet
  sheetOverlay: {
    flex: 1,
    backgroundColor: "rgba(29,26,22,0.22)"
  },
  sheetCard: {
    position: "absolute",
    left: 14,
    right: 14,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.rule,
    borderRadius: 16,
    padding: 14,
    shadowColor: colors.ink,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.35,
    shadowRadius: 30,
    elevation: 10
  },
  sheetTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.ruleSoft
  },
  sheetMeta: {
    flex: 1
  },
  sheetName: {
    fontFamily: font.sansSemiBold,
    fontSize: 14,
    color: colors.ink
  },
  sheetSub: {
    fontFamily: font.sans,
    fontSize: 12,
    color: colors.ink3,
    marginTop: 1
  },
  sheetCondition: {
    marginTop: 8
  },
  sheetCurrentQty: {
    fontFamily: font.serif,
    fontSize: 26,
    color: colors.ink,
    lineHeight: 28
  },
  sheetQtyX: {
    color: colors.ink4,
    fontSize: 16
  },
  sheetQtyRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12
  },
  sheetQtyLabel: {
    fontFamily: font.sans,
    fontSize: 12,
    color: colors.ink3
  },
  stepper: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    backgroundColor: colors.card2,
    borderWidth: 1,
    borderColor: colors.ruleSoft,
    borderRadius: radius.md,
    padding: 2
  },
  stepBtn: {
    width: 32,
    height: 30,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center"
  },
  stepBtnPrimary: {
    backgroundColor: colors.ink
  },
  stepValue: {
    minWidth: 34,
    textAlign: "center",
    fontFamily: font.serif,
    fontSize: 22,
    color: colors.ink,
    lineHeight: 24
  },
  sheetActions: {
    flexDirection: "row",
    gap: 8,
    marginTop: 10
  },
  actionBtn: {
    flex: 1,
    paddingVertical: 9,
    paddingHorizontal: 14,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center"
  },
  actionBtnGhost: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.rule
  },
  actionBtnPrimary: {
    backgroundColor: colors.ink
  },
  actionBtnTextGhost: {
    fontFamily: font.sansSemiBold,
    fontSize: 13,
    color: colors.ink
  },
  actionBtnTextPrimary: {
    fontFamily: font.sansSemiBold,
    fontSize: 13,
    color: colors.card
  }
});
