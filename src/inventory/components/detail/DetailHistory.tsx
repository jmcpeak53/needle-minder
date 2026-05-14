import { StyleSheet, Text, View } from "react-native";

import { colors, font } from "../../../ui/theme";

type Props = {
  fullQuantity: number;
  partialQuantity: number;
  formattedUpdatedAt: string;
};

export function DetailHistory({ fullQuantity, partialQuantity, formattedUpdatedAt }: Props) {
  const total = fullQuantity + partialQuantity;
  const breakdown = [
    fullQuantity > 0 ? `${fullQuantity} full` : null,
    partialQuantity > 0 ? `${partialQuantity} partial` : null
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>History</Text>
        <Text style={styles.sectionAction}>All activity</Text>
      </View>

      <View style={styles.row}>
        <View style={[styles.pip, styles.pipPlus]}>
          <Text style={[styles.pipText, styles.pipTextPlus]}>×{total}</Text>
        </View>
        <View style={styles.meta}>
          <Text style={styles.title}>In stash</Text>
          <Text style={styles.sub}>{breakdown || "No skeins"}</Text>
        </View>
        <Text style={styles.date}>{formattedUpdatedAt}</Text>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
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
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.ruleSoft
  },
  pip: {
    width: 28,
    height: 24,
    borderRadius: 8,
    backgroundColor: colors.card2,
    alignItems: "center",
    justifyContent: "center"
  },
  pipPlus: {
    backgroundColor: "#e1ebdb"
  },
  pipText: {
    fontFamily: font.mono,
    fontSize: 10,
    fontWeight: "600",
    color: colors.ink3
  },
  pipTextPlus: {
    color: colors.ok
  },
  meta: {
    flex: 1
  },
  title: {
    fontFamily: font.sans,
    fontSize: 13,
    color: colors.ink
  },
  sub: {
    fontFamily: font.sans,
    fontSize: 11,
    color: colors.ink4,
    marginTop: 1
  },
  date: {
    fontFamily: font.mono,
    fontSize: 11,
    color: colors.ink4
  }
});
