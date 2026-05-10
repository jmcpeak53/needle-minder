import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { MAX_INVENTORY_NOTES_LENGTH } from "../inventory/inventoryNotes";
import { colors, font, radius, spacing } from "./theme";
import type { ThreadCondition } from "../types";

interface InventoryFormProps {
  quantity: number;
  onQuantityChange: (quantity: number) => void;
  condition: ThreadCondition;
  onConditionChange: (condition: ThreadCondition) => void;
  favorite: boolean;
  onFavoriteChange: (value: boolean) => void;
  notes: string;
  onNotesChange: (notes: string) => void;
}

export function InventoryForm({
  quantity,
  onQuantityChange,
  condition,
  onConditionChange,
  favorite,
  onFavoriteChange,
  notes,
  onNotesChange
}: InventoryFormProps) {
  return (
    <View style={styles.container}>
      <View style={styles.qtyRow}>
        <Text style={styles.label}>Quantity</Text>
        <View style={styles.stepper}>
          <Pressable
            style={[styles.stepBtn, styles.stepBtnPrimary]}
            onPress={() => onQuantityChange(Math.max(1, quantity - 1))}
          >
            <Ionicons name="remove" size={14} color={colors.card} />
          </Pressable>
          <Text style={styles.stepValue}>{quantity}</Text>
          <Pressable
            style={styles.stepBtn}
            onPress={() => onQuantityChange(quantity + 1)}
          >
            <Ionicons name="add" size={14} color={colors.ink} />
          </Pressable>
        </View>
      </View>

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

      <View style={styles.condRow}>
        {(["full", "partial"] as ThreadCondition[]).map((c) => (
          <Pressable
            key={c}
            onPress={() => onConditionChange(c)}
            style={[styles.condBtn, condition === c && styles.condBtnActive]}
          >
            <Text style={[styles.condBtnText, condition === c && styles.condBtnTextActive]}>
              {c.charAt(0).toUpperCase() + c.slice(1)}
            </Text>
          </Pressable>
        ))}
      </View>

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

const styles = StyleSheet.create({
  container: {
    gap: spacing.md
  },
  qtyRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between"
  },
  label: {
    fontFamily: font.sans,
    fontSize: 13,
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
  condRow: {
    flexDirection: "row",
    gap: spacing.sm
  },
  condBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: radius.md,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.rule,
    alignItems: "center"
  },
  condBtnActive: {
    backgroundColor: colors.card2,
    borderColor: colors.ink
  },
  condBtnText: {
    fontFamily: font.sansMedium,
    fontSize: 13,
    color: colors.ink3
  },
  condBtnTextActive: {
    color: colors.ink
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
