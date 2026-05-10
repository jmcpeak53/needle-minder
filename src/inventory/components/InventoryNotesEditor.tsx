import { useState } from "react";
import { StyleSheet, Text, TextInput, View } from "react-native";
import type { NativeSyntheticEvent, TextInputContentSizeChangeEventData } from "react-native";

import {
  INVENTORY_NOTES_WARN_THRESHOLD,
  MAX_INVENTORY_NOTES_LENGTH,
  MIN_INVENTORY_NOTES_INPUT_HEIGHT
} from "../inventoryNotes";
import { colors, font, radius, spacing } from "../../ui/theme";

type Props = {
  value: string;
  onChangeText: (value: string) => void;
  onBlur: () => void;
};

export function InventoryNotesEditor({ value, onChangeText, onBlur }: Props) {
  const [inputHeight, setInputHeight] = useState(MIN_INVENTORY_NOTES_INPUT_HEIGHT);
  const notesCount = value.length;

  function handleContentSizeChange(
    event: NativeSyntheticEvent<TextInputContentSizeChangeEventData>
  ) {
    setInputHeight(Math.max(MIN_INVENTORY_NOTES_INPUT_HEIGHT, Math.ceil(event.nativeEvent.contentSize.height)));
  }

  return (
    <View style={styles.card}>
      <Text style={styles.label}>Notes</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        onBlur={onBlur}
        onContentSizeChange={handleContentSizeChange}
        placeholder="Notes about this skein..."
        placeholderTextColor={colors.ink4}
        multiline
        textAlignVertical="top"
        maxLength={MAX_INVENTORY_NOTES_LENGTH}
        style={[styles.input, { height: inputHeight }]}
      />
      <Text style={[styles.counter, notesCount > INVENTORY_NOTES_WARN_THRESHOLD && styles.counterWarn]}>
        {notesCount}/{MAX_INVENTORY_NOTES_LENGTH}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.ruleSoft,
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: spacing.sm,
    marginBottom: spacing.md
  },
  label: {
    fontFamily: font.serif,
    fontSize: 18,
    color: colors.ink
  },
  input: {
    backgroundColor: colors.card2,
    borderWidth: 1,
    borderColor: colors.ruleSoft,
    borderRadius: radius.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontFamily: font.sans,
    fontSize: 14,
    color: colors.ink
  },
  counter: {
    alignSelf: "flex-end",
    fontFamily: font.mono,
    fontSize: 11,
    color: colors.ink4
  },
  counterWarn: {
    color: colors.accent
  }
});
