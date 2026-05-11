import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { colors, font, radius, spacing } from "../../../ui/theme";

type Props = {
  quantity: number;
  onDecrement: () => void;
  onIncrement: () => void;
};

export function DetailCounter({ quantity, onDecrement, onIncrement }: Props) {
  return (
    <View style={styles.card}>
      <Text style={styles.value}>
        <Text style={styles.x}>×</Text>
        {quantity}
      </Text>
      <View style={styles.controls}>
        <Pressable
          style={[styles.button, styles.buttonPrimary]}
          onPress={onDecrement}
          testID="detail-decrement-button"
        >
          <Ionicons name="remove" size={20} color={colors.card} />
        </Pressable>
        <Pressable style={styles.button} onPress={onIncrement} testID="detail-increment-button">
          <Ionicons name="add" size={20} color={colors.ink} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card2,
    borderWidth: 1,
    borderColor: colors.ruleSoft,
    borderRadius: 16,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.md
  },
  value: {
    fontFamily: font.serif,
    fontSize: 48,
    color: colors.ink,
    lineHeight: 48
  },
  x: {
    color: colors.ink4,
    fontSize: 24,
    marginRight: 4
  },
  controls: {
    flexDirection: "row",
    gap: 6
  },
  button: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.rule,
    alignItems: "center",
    justifyContent: "center"
  },
  buttonPrimary: {
    backgroundColor: colors.accent,
    borderColor: colors.accent
  }
});
