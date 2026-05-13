import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useMemo } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useInventory } from "../../src/state/InventoryContext";
import { SkeinBall } from "../../src/ui/SkeinBall";
import { colors, font, NAV_HEIGHT, radius, spacing } from "../../src/ui/theme";

export default function HomeScreen() {
  const { ready, inventory } = useInventory();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const { stats, lowStockItems } = useMemo(() => {
    if (!inventory.length) {
      return {
        stats: { total: 0, unique: 0, catalogs: 0, lowStock: 0 },
        lowStockItems: []
      };
    }

    let total = 0;
    const catalogsSet = new Set<string>();
    const lowStockItemsArr = [];

    for (const item of inventory) {
      total += item.quantity;
      catalogsSet.add(item.referenceColor.threadTypeId);
      if (item.favorite && item.quantity <= 2) {
        lowStockItemsArr.push(item);
      }
    }

    return {
      stats: {
        total,
        unique: inventory.length,
        catalogs: catalogsSet.size,
        lowStock: lowStockItemsArr.length
      },
      lowStockItems: lowStockItemsArr
    };
  }, [inventory]);

  const recentItems = useMemo(
    () => [...inventory].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).slice(0, 5),
    [inventory]
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
        {/* App bar */}
        <View style={styles.appbar}>
          <View style={styles.appbarGrow}>
            <Text style={styles.appbarTitle}>Welcome back. Ready to stitch?</Text>
            <Text style={styles.appbarSub}>
              {stats.total} skeins · {stats.catalogs} {stats.catalogs === 1 ? "catalog" : "catalogs"} · {stats.unique} unique
            </Text>
          </View>
          <Pressable
            onPress={() => router.push("/stash")}
            style={styles.iconBtn}
          >
            <Ionicons name="search-outline" size={18} color={colors.ink2} />
          </Pressable>
        </View>

        {/* Stats grid */}
        <View style={styles.statsGrid}>
          <StatCard label="skeins in stash" value={stats.total} tag="total" onPress={() => router.push("/stash")} />
          <StatCard label="distinct colors" value={stats.unique} tag="unique" onPress={() => router.push("/stash")} />
          <StatCard label="catalogs" value={stats.catalogs} tag="catalogs" onPress={() => router.push("/stash")} />
          <StatCard
            label="running low"
            value={stats.lowStock}
            tag="alert"
            warn={stats.lowStock > 0}
            onPress={() => router.push({ pathname: "/stash", params: { filter: "low" } })}
          />
        </View>

        {/* Low stock strip */}
        {lowStockItems.length > 0 && (
          <Pressable
            onPress={() => router.push({ pathname: "/stash", params: { filter: "low" } })}
            style={styles.lowstockStrip}
          >
            <View style={styles.lowstockIcon}>
              <Text style={styles.lowstockBang}>!</Text>
            </View>
            <Text style={styles.lowstockText}>
              <Text style={styles.lowstockBold}>{lowStockItems.length} favorites</Text>
              {" "}down to two skeins. Restock?
            </Text>
            <Text style={styles.lowstockArrow}>→</Text>
          </Pressable>
        )}

        {/* Recently added */}
        {recentItems.length > 0 && (
          <>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recently added</Text>
              <Pressable onPress={() => router.push("/stash")}>
                <Text style={styles.sectionAction}>See all</Text>
              </Pressable>
            </View>

            {recentItems.map((item) => {
              const age = formatAge(item.updatedAt);
              return (
                <Pressable
                  key={item.id}
                  onPress={() => router.push(`/detail/${item.id}`)}
                  style={styles.recentRow}
                >
                  <SkeinBall color={item.referenceColor.hexRgb} size={44} />
                  <View style={styles.recentMeta}>
                    <View style={styles.recentName}>
                      <Text style={styles.recentNameText} numberOfLines={1}>
                        {item.referenceColor.colorName}
                      </Text>
                      <Text style={styles.recentCode}>
                        {item.referenceColor.colorCode}
                      </Text>
                    </View>
                    <Text style={styles.recentSub}>
                      {item.condition === "full" ? "Full skein" : "Partial skein"} · {item.referenceColor.colorFamily}
                    </Text>
                  </View>
                  <View style={styles.recentRight}>
                    <Text style={styles.recentQty}>
                      <Text style={styles.recentQtyX}>×</Text>
                      {item.quantity}
                    </Text>
                    <Text style={styles.recentTime}>{age}</Text>
                  </View>
                </Pressable>
              );
            })}
          </>
        )}

        {inventory.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>Your stash is empty</Text>
            <Text style={styles.emptyBody}>
              Tap + to scan a skein label or add one manually.
            </Text>
          </View>
        )}
      </ScrollView>

    </View>
  );
}

function StatCard({
  label,
  value,
  tag,
  warn = false,
  onPress
}: {
  label: string;
  value: number;
  tag: string;
  warn?: boolean;
  onPress?: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={[styles.statCard, warn && styles.statCardWarn]}>
      <Text style={styles.statTag}>{tag}</Text>
      <Text style={[styles.statValue, warn && styles.statValueWarn]}>{value}</Text>
      <Text style={[styles.statLabel, warn && styles.statLabelWarn]}>{label}</Text>
    </Pressable>
  );
}

function formatAge(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  const hrs = Math.floor(diff / 3_600_000);
  const days = Math.floor(diff / 86_400_000);
  if (mins < 60) return `${mins}m ago`;
  if (hrs < 24) return `${hrs}h ago`;
  if (days === 1) return "yesterday";
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
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
    gap: spacing.md,
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
    borderWidth: 1,
    borderColor: colors.rule,
    backgroundColor: colors.card,
    alignItems: "center",
    justifyContent: "center"
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    paddingVertical: spacing.sm
  },
  statCard: {
    flex: 1,
    minWidth: "45%",
    backgroundColor: colors.card2,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.ruleSoft,
    padding: 14
  },
  statCardWarn: {
    // no extra bg change — just color on value/label
  },
  statTag: {
    fontFamily: font.mono,
    fontSize: 9,
    color: colors.ink4,
    letterSpacing: 0.5,
    textTransform: "uppercase",
    marginBottom: 6
  },
  statValue: {
    fontFamily: font.serif,
    fontSize: 36,
    color: colors.ink,
    lineHeight: 36,
    letterSpacing: -1
  },
  statValueWarn: {
    color: colors.accent
  },
  statLabel: {
    fontFamily: font.sans,
    fontSize: 11,
    color: colors.ink3,
    marginTop: 6,
    letterSpacing: 0.2
  },
  statLabelWarn: {
    color: colors.accent,
    fontFamily: font.sansBold
  },
  lowstockStrip: {
    backgroundColor: "#f8e9d8",
    borderWidth: 1,
    borderColor: "#e8c9a3",
    borderRadius: radius.lg,
    padding: 12,
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 12
  },
  lowstockIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#e8c9a3",
    alignItems: "center",
    justifyContent: "center"
  },
  lowstockBang: {
    fontFamily: font.serifItalic,
    fontSize: 22,
    color: colors.accent
  },
  lowstockText: {
    flex: 1,
    fontFamily: font.sans,
    fontSize: 13,
    color: "#7a4d1f",
    lineHeight: 18
  },
  lowstockBold: {
    color: colors.accent,
    fontFamily: font.sansBold
  },
  lowstockArrow: {
    fontFamily: font.sans,
    fontSize: 14,
    color: colors.accent,
    fontWeight: "600"
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
  recentRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.ruleSoft
  },
  recentMeta: {
    flex: 1,
    minWidth: 0
  },
  recentName: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 6
  },
  recentNameText: {
    fontFamily: font.sansSemiBold,
    fontSize: 14,
    color: colors.ink,
    letterSpacing: -0.1,
    flexShrink: 1
  },
  recentCode: {
    fontFamily: font.mono,
    fontSize: 11,
    color: colors.ink3
  },
  recentSub: {
    fontFamily: font.sans,
    fontSize: 12,
    color: colors.ink3,
    lineHeight: 16,
    marginTop: 2
  },
  recentRight: {
    alignItems: "flex-end"
  },
  recentQty: {
    fontFamily: font.serif,
    fontSize: 20,
    color: colors.ink,
    lineHeight: 22
  },
  recentQtyX: {
    color: colors.ink4,
    fontSize: 13
  },
  recentTime: {
    fontFamily: font.mono,
    fontSize: 11,
    color: colors.ink4
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
    color: colors.ink3,
    textAlign: "center"
  },
});
