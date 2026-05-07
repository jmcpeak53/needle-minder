import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useNeedleMinder } from "../../src/state/NeedleMinderContext";
import { SkeinBall } from "../../src/ui/SkeinBall";
import { colors, font, radius, spacing } from "../../src/ui/theme";
import type { ReferenceColor, ThreadCondition } from "../../src/types";

export default function AddScreen() {
  const { ready, catalog, addInventory } = useNeedleMinder();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState("");
  const [selectedColor, setSelectedColor] = useState<ReferenceColor | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [condition, setCondition] = useState<ThreadCondition>("full");
  const [notes, setNotes] = useState("");

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return catalog.slice(0, 40);
    return catalog.filter(
      (c) =>
        c.colorCode.toLowerCase().includes(q) ||
        c.colorName.toLowerCase().includes(q) ||
        c.colorFamily.toLowerCase().includes(q)
    );
  }, [catalog, query]);

  if (!ready) return <View style={[styles.screen, { paddingTop: insets.top }]} />;

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      {/* App bar */}
      <View style={styles.appbar}>
        <Pressable onPress={() => router.back()} style={styles.iconBtn}>
          <Ionicons name="chevron-back" size={18} color={colors.ink2} />
        </Pressable>
        <Text style={styles.appbarTitle}>Add manually</Text>
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

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Selected color form */}
        {selectedColor && (
          <View style={styles.selectedCard}>
            <View style={styles.selectedHeader}>
              <SkeinBall color={selectedColor.hexRgb} size={52} />
              <View style={{ flex: 1 }}>
                <Text style={styles.selectedName}>{selectedColor.colorName}</Text>
                <Text style={styles.selectedCode}>{selectedColor.colorCode} · {selectedColor.colorFamily}</Text>
              </View>
              <Pressable onPress={() => setSelectedColor(null)} style={styles.iconBtn}>
                <Ionicons name="close" size={16} color={colors.ink3} />
              </Pressable>
            </View>

            {/* Qty stepper */}
            <View style={styles.qtyRow}>
              <Text style={styles.qtyLabel}>Quantity</Text>
              <View style={styles.stepper}>
                <Pressable
                  style={[styles.stepBtn, styles.stepBtnPrimary]}
                  onPress={() => setQuantity((q) => Math.max(1, q - 1))}
                >
                  <Ionicons name="remove" size={14} color={colors.card} />
                </Pressable>
                <Text style={styles.stepValue}>{quantity}</Text>
                <Pressable style={styles.stepBtn} onPress={() => setQuantity((q) => q + 1)}>
                  <Ionicons name="add" size={14} color={colors.ink} />
                </Pressable>
              </View>
            </View>

            {/* Condition */}
            <View style={styles.condRow}>
              {(["full", "partial"] as ThreadCondition[]).map((c) => (
                <Pressable
                  key={c}
                  onPress={() => setCondition(c)}
                  style={[styles.condBtn, condition === c && styles.condBtnActive]}
                >
                  <Text style={[styles.condBtnText, condition === c && styles.condBtnTextActive]}>
                    {c.charAt(0).toUpperCase() + c.slice(1)}
                  </Text>
                </Pressable>
              ))}
            </View>

            {/* Notes */}
            <TextInput
              value={notes}
              onChangeText={setNotes}
              placeholder="Notes (optional)"
              placeholderTextColor={colors.ink4}
              style={styles.notesInput}
              multiline
            />

            <Pressable
              style={styles.saveBtn}
              onPress={async () => {
                await addInventory({ referenceColorId: selectedColor.id, quantity, condition, notes });
                setSelectedColor(null);
                setQuantity(1);
                setCondition("full");
                setNotes("");
                router.back();
              }}
            >
              <Text style={styles.saveBtnText}>Save to stash</Text>
              <Ionicons name="checkmark" size={16} color={colors.card} />
            </Pressable>
          </View>
        )}

        {/* Results list */}
        {results.map((color) => (
          <Pressable
            key={color.id}
            onPress={() => setSelectedColor(color)}
            style={[styles.resultRow, selectedColor?.id === color.id && styles.resultRowSelected]}
          >
            <SkeinBall color={color.hexRgb} size={40} />
            <View style={{ flex: 1 }}>
              <Text style={styles.resultName}>{color.colorCode} <Text style={styles.resultColorName}>{color.colorName}</Text></Text>
              <Text style={styles.resultFamily}>{color.colorFamily}</Text>
            </View>
            <Ionicons name="chevron-forward" size={14} color={colors.ink4} />
          </Pressable>
        ))}
      </ScrollView>
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
  scroll: { paddingHorizontal: spacing.lg },
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
  qtyRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  qtyLabel: { fontFamily: font.sans, fontSize: 13, color: colors.ink3 },
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
  stepBtnPrimary: { backgroundColor: colors.ink },
  stepValue: {
    minWidth: 34,
    textAlign: "center",
    fontFamily: font.serif,
    fontSize: 22,
    color: colors.ink,
    lineHeight: 24
  },
  condRow: { flexDirection: "row", gap: spacing.sm },
  condBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: radius.md,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.rule,
    alignItems: "center"
  },
  condBtnActive: { backgroundColor: colors.card2, borderColor: colors.ink },
  condBtnText: { fontFamily: font.sansMedium, fontSize: 13, color: colors.ink3 },
  condBtnTextActive: { color: colors.ink },
  notesInput: {
    fontFamily: font.sans,
    fontSize: 14,
    color: colors.ink,
    backgroundColor: colors.card2,
    borderWidth: 1,
    borderColor: colors.ruleSoft,
    borderRadius: radius.md,
    padding: 10,
    minHeight: 60
  },
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
  resultFamily: { fontFamily: font.sans, fontSize: 12, color: colors.ink3, marginTop: 1 }
});
