import { useRouter } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ShoppingShortfallCard } from "../../src/projects/components/ShoppingShortfallCard";
import { useNeedleMinder } from "../../src/state/NeedleMinderContext";
import { colors, font, radius, spacing } from "../../src/ui/theme";

export default function ProjectShoppingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { shoppingShortfalls } = useNeedleMinder();

  const totalMissing = shoppingShortfalls.reduce((sum, item) => sum + item.missingQuantity, 0);

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <View style={styles.appbar}>
        <Pressable onPress={() => router.back()}>
          <Text style={styles.back}>Back</Text>
        </Pressable>
        <Text style={styles.title}>Shopping</Text>
        <View style={styles.appbarSpacer} />
      </View>

      <View style={styles.summaryCard}>
        <Text style={styles.summaryValue}>{totalMissing}</Text>
        <Text style={styles.summaryLabel}>skeins still needed across {shoppingShortfalls.length} color{shoppingShortfalls.length === 1 ? "" : "s"}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
        {shoppingShortfalls.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>Nothing to buy</Text>
            <Text style={styles.emptyBody}>Every active project is already covered by your stash.</Text>
          </View>
        ) : (
          shoppingShortfalls.map((item) => (
            <ShoppingShortfallCard key={item.referenceColor.id} item={item} />
          ))
        )}
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
  summaryCard: {
    backgroundColor: colors.accent,
    borderRadius: radius.xl,
    padding: spacing.lg
  },
  summaryValue: {
    fontFamily: font.serif,
    fontSize: 42,
    color: colors.card,
    lineHeight: 42
  },
  summaryLabel: {
    fontFamily: font.sans,
    fontSize: 13,
    color: "rgba(250,246,236,0.92)",
    marginTop: 6
  },
  list: {
    paddingVertical: spacing.md,
    gap: spacing.md,
    paddingBottom: 32
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
