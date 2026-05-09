import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";

import type { ProjectReservationDetail } from "../types";
import { colors, font, radius, spacing } from "../../ui/theme";

type Props = {
  reservation: ProjectReservationDetail;
  onPress?: () => void;
};

export function ReservationRow({ reservation, onPress }: Props) {
  const content = (
    <View style={styles.inner}>
      <View style={styles.meta}>
        <Text style={styles.name} numberOfLines={1}>
          {reservation.referenceColor.colorName}
        </Text>
        <Text style={styles.sub} numberOfLines={1}>
          {reservation.referenceColor.colorCode} · {reservation.referenceColor.colorFamily}
        </Text>
        <Text style={[styles.health, reservation.stillNeed > 0 ? styles.healthWarn : styles.healthOk]}>
          In stash {reservation.physicalStash} · Reserved {reservation.reserved} · Available {reservation.available}
        </Text>
      </View>

      <View style={styles.right}>
        <View style={styles.qtyBox}>
          <Text style={styles.qtyLabel}>Needed</Text>
          <Text style={styles.qtyValue}>{reservation.quantity}</Text>
        </View>
        {reservation.stillNeed > 0 ? (
          <View style={[styles.qtyBox, styles.qtyWarn]}>
            <Text style={[styles.qtyLabel, styles.qtyWarnLabel]}>Still need</Text>
            <Text style={[styles.qtyValue, styles.qtyWarnValue]}>{reservation.stillNeed}</Text>
          </View>
        ) : null}
        {onPress ? <Ionicons name="chevron-forward" size={16} color={colors.ink4} /> : null}
      </View>
    </View>
  );

  if (!onPress) {
    return <View style={styles.row}>{content}</View>;
  }

  return (
    <Pressable onPress={onPress} style={styles.row}>
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.ruleSoft,
    borderRadius: radius.md,
    padding: spacing.md
  },
  inner: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm
  },
  meta: {
    flex: 1,
    minWidth: 0
  },
  name: {
    fontFamily: font.sansSemiBold,
    fontSize: 14,
    color: colors.ink
  },
  sub: {
    fontFamily: font.mono,
    fontSize: 11,
    color: colors.ink3,
    marginTop: 2
  },
  health: {
    fontFamily: font.sans,
    fontSize: 11,
    marginTop: 6
  },
  healthOk: {
    color: colors.ok
  },
  healthWarn: {
    color: colors.accent
  },
  right: {
    alignItems: "flex-end",
    gap: 6
  },
  qtyBox: {
    minWidth: 74,
    backgroundColor: colors.card2,
    borderRadius: radius.md,
    paddingHorizontal: 10,
    paddingVertical: 7,
    alignItems: "center"
  },
  qtyWarn: {
    backgroundColor: colors.accentTint
  },
  qtyLabel: {
    fontFamily: font.sans,
    fontSize: 10,
    color: colors.ink3
  },
  qtyWarnLabel: {
    color: colors.accent
  },
  qtyValue: {
    fontFamily: font.serif,
    fontSize: 22,
    color: colors.ink,
    lineHeight: 24
  },
  qtyWarnValue: {
    color: colors.accent
  }
});
