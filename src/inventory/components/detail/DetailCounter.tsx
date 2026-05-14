import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { colors, font, radius, spacing } from "../../../ui/theme";

type Props = {
  fullQuantity: number;
  partialQuantity: number;
  onFullDecrement: () => void;
  onFullIncrement: () => void;
  onPartialDecrement: () => void;
  onPartialIncrement: () => void;
};

export function DetailCounter({
  fullQuantity,
  partialQuantity,
  onFullDecrement,
  onFullIncrement,
  onPartialDecrement,
  onPartialIncrement
}: Props) {
  const total = fullQuantity + partialQuantity;
  const fullDecrementDisabled = fullQuantity <= 0;
  const partialDecrementDisabled = partialQuantity <= 0;

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.totalValue}>
          <Text style={styles.totalX}>×</Text>
          {total}
        </Text>
        <View style={styles.pills}>
          <View style={[styles.pill, styles.pillFull]}>
            <View style={styles.dotFull} />
            <Text style={styles.pillText}>{fullQuantity} full</Text>
          </View>
          <View style={[styles.pill, styles.pillPartial]}>
            <View style={styles.dotPartial}>
              <View style={styles.dotPartialFill} />
            </View>
            <Text style={styles.pillText}>{partialQuantity} partial</Text>
          </View>
        </View>
      </View>

      <Text style={styles.totalLabel}>TOTAL SKEINS</Text>

      <View style={styles.divider} />

      <View style={styles.row}>
        <View style={styles.rowLabel}>
          <View style={styles.dotFull} />
          <Text style={styles.rowLabelText}>Full skeins</Text>
        </View>
        <View style={styles.stepper}>
          <Pressable
            style={[styles.stepBtn, styles.stepBtnPrimary, fullDecrementDisabled && styles.stepBtnDisabled]}
            onPress={onFullDecrement}
            disabled={fullDecrementDisabled}
            testID="detail-full-decrement-button"
          >
            <Ionicons name="remove" size={18} color={colors.card} />
          </Pressable>
          <Text style={styles.stepValue}>{fullQuantity}</Text>
          <Pressable
            style={styles.stepBtn}
            onPress={onFullIncrement}
            testID="detail-full-increment-button"
          >
            <Ionicons name="add" size={18} color={colors.ink} />
          </Pressable>
        </View>
      </View>

      <View style={styles.divider} />

      <View style={styles.row}>
        <View style={styles.rowLabel}>
          <View style={styles.dotPartial}>
            <View style={styles.dotPartialFill} />
          </View>
          <Text style={styles.rowLabelText}>Partial skeins</Text>
        </View>
        <View style={styles.stepper}>
          <Pressable
            style={[styles.stepBtn, styles.stepBtnPrimary, partialDecrementDisabled && styles.stepBtnDisabled]}
            onPress={onPartialDecrement}
            disabled={partialDecrementDisabled}
            testID="detail-partial-decrement-button"
          >
            <Ionicons name="remove" size={18} color={colors.card} />
          </Pressable>
          <Text style={styles.stepValue}>{partialQuantity}</Text>
          <Pressable
            style={styles.stepBtn}
            onPress={onPartialIncrement}
            testID="detail-partial-increment-button"
          >
            <Ionicons name="add" size={18} color={colors.ink} />
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const dotSize = 10;

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card2,
    borderWidth: 1,
    borderColor: colors.ruleSoft,
    borderRadius: 16,
    padding: 16,
    marginBottom: spacing.md
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm
  },
  totalValue: {
    fontFamily: font.serif,
    fontSize: 48,
    color: colors.ink,
    lineHeight: 48
  },
  totalX: {
    color: colors.ink4,
    fontSize: 24,
    marginRight: 4
  },
  totalLabel: {
    fontFamily: font.sans,
    fontSize: 11,
    color: colors.ink3,
    letterSpacing: 1.2,
    marginTop: 2
  },
  pills: {
    flexDirection: "row",
    gap: spacing.sm,
    flexShrink: 1,
    flexWrap: "wrap",
    justifyContent: "flex-end"
  },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.pill,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.ruleSoft
  },
  pillFull: {
    backgroundColor: colors.okSoft,
    borderColor: colors.okSoft
  },
  pillPartial: {
    backgroundColor: colors.warnSoft,
    borderColor: colors.warnSoft
  },
  pillText: {
    fontFamily: font.sansMedium,
    fontSize: 12,
    color: colors.ink2
  },
  dotFull: {
    width: dotSize,
    height: dotSize,
    borderRadius: dotSize / 2,
    backgroundColor: colors.ok
  },
  dotPartial: {
    width: dotSize,
    height: dotSize,
    borderRadius: dotSize / 2,
    borderWidth: 1.2,
    borderColor: colors.warn,
    overflow: "hidden",
    backgroundColor: colors.card
  },
  dotPartialFill: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    width: "50%",
    backgroundColor: colors.warn
  },
  divider: {
    height: 1,
    backgroundColor: colors.ruleSoft,
    marginVertical: spacing.md
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between"
  },
  rowLabel: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm
  },
  rowLabelText: {
    fontFamily: font.sansSemiBold,
    fontSize: 15,
    color: colors.ink
  },
  stepper: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4
  },
  stepBtn: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.rule,
    alignItems: "center",
    justifyContent: "center"
  },
  stepBtnPrimary: {
    backgroundColor: colors.accent,
    borderColor: colors.accent
  },
  stepBtnDisabled: {
    opacity: 0.35
  },
  stepValue: {
    minWidth: 36,
    textAlign: "center",
    fontFamily: font.serif,
    fontSize: 22,
    color: colors.ink,
    lineHeight: 24
  }
});
