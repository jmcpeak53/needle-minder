import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import { MAX_INVENTORY_NOTES_LENGTH } from "../inventory/inventoryNotes";
import { colors, font, radius, spacing } from "./theme";

type Props = {
  fullQuantity: number;
  onFullQuantityChange: (value: number) => void;
  partialQuantity: number;
  onPartialQuantityChange: (value: number) => void;
  favorite: boolean;
  onFavoriteChange: (value: boolean) => void;
  notes: string;
  onNotesChange: (notes: string) => void;
};

export function MergedInventoryForm({
  fullQuantity,
  onFullQuantityChange,
  partialQuantity,
  onPartialQuantityChange,
  favorite,
  onFavoriteChange,
  notes,
  onNotesChange
}: Props) {
  return (
    <View style={styles.container}>
      <QuantityRow
        label="Full skeins"
        kind="full"
        value={fullQuantity}
        onChange={onFullQuantityChange}
      />
      <QuantityRow
        label="Partial skeins"
        kind="partial"
        value={partialQuantity}
        onChange={onPartialQuantityChange}
      />

      <Pressable style={styles.favoriteRow} onPress={() => onFavoriteChange(!favorite)}>
        <Ionicons
          name={favorite ? "star" : "star-outline"}
          size={18}
          color={favorite ? "#e6a817" : colors.ink3}
        />
        <Text style={[styles.favoriteLabel, favorite && styles.favoriteLabelActive]}>
          Mark as favorite
        </Text>
      </Pressable>

      <TextInput
        value={notes}
        onChangeText={onNotesChange}
        placeholder="Notes (optional)"
        placeholderTextColor={colors.ink4}
        style={styles.notesInput}
        multiline
        maxLength={MAX_INVENTORY_NOTES_LENGTH}
      />
    </View>
  );
}

function QuantityRow({
  label,
  kind,
  value,
  onChange
}: {
  label: string;
  kind: "full" | "partial";
  value: number;
  onChange: (value: number) => void;
}) {
  const decDisabled = value <= 0;
  return (
    <View style={styles.row}>
      <View style={styles.rowLabel}>
        {kind === "full" ? (
          <View style={styles.dotFull} />
        ) : (
          <View style={styles.dotPartial}>
            <View style={styles.dotPartialFill} />
          </View>
        )}
        <Text style={styles.label}>{label}</Text>
      </View>
      <View style={styles.stepper}>
        <Pressable
          style={[styles.stepBtn, styles.stepBtnPrimary, decDisabled && styles.stepBtnDisabled]}
          onPress={() => onChange(Math.max(0, value - 1))}
          disabled={decDisabled}
        >
          <Ionicons name="remove" size={14} color={colors.card} />
        </Pressable>
        <Text style={styles.stepValue}>{value}</Text>
        <Pressable style={styles.stepBtn} onPress={() => onChange(value + 1)}>
          <Ionicons name="add" size={14} color={colors.ink} />
        </Pressable>
      </View>
    </View>
  );
}

const dotSize = 10;

const styles = StyleSheet.create({
  container: {
    gap: spacing.md
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
  label: {
    fontFamily: font.sansMedium,
    fontSize: 14,
    color: colors.ink
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
  stepBtnDisabled: {
    opacity: 0.35
  },
  stepValue: {
    minWidth: 34,
    textAlign: "center",
    fontFamily: font.serif,
    fontSize: 22,
    color: colors.ink,
    lineHeight: 24
  },
  favoriteRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingVertical: 6
  },
  favoriteLabel: {
    fontFamily: font.sans,
    fontSize: 13,
    color: colors.ink3
  },
  favoriteLabelActive: {
    color: "#e6a817"
  },
  notesInput: {
    fontFamily: font.sans,
    fontSize: 14,
    color: colors.ink,
    backgroundColor: colors.card2,
    borderWidth: 1,
    borderColor: colors.ruleSoft,
    borderRadius: radius.md,
    padding: 10,
    minHeight: 60,
    textAlignVertical: "top"
  }
});
