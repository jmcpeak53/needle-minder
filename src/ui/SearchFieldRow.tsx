import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, TextInput, View } from "react-native";
import type { StyleProp, TextInputProps, TextStyle, ViewStyle } from "react-native";

import { colors, font, radius, spacing } from "./theme";

const CLEAR_BUTTON_HIT_SLOP = { top: 8, right: 8, bottom: 8, left: 8 };

type Props = {
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
  onClear?: () => void;
  showClearButton?: boolean;
  autoFocus?: boolean;
  returnKeyType?: TextInputProps["returnKeyType"];
  placeholderTextColor?: string;
  iconColor?: string;
  clearIconColor?: string;
  containerStyle?: StyleProp<ViewStyle>;
  inputStyle?: StyleProp<TextStyle>;
  inputTestID?: string;
  clearButtonTestID?: string;
};

export function SearchFieldRow({
  value,
  onChangeText,
  placeholder,
  onClear,
  showClearButton = true,
  autoFocus = false,
  returnKeyType = "search",
  placeholderTextColor = colors.ink3,
  iconColor = colors.ink4,
  clearIconColor = colors.ink4,
  containerStyle,
  inputStyle,
  inputTestID,
  clearButtonTestID
}: Props) {
  const canClear = showClearButton && value.length > 0;
  const handleClear = onClear ?? (() => onChangeText(""));

  return (
    <View style={[styles.row, containerStyle]}>
      <Ionicons name="search-outline" size={16} color={iconColor} />
      <TextInput
        testID={inputTestID}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={placeholderTextColor}
        style={[styles.input, inputStyle]}
        autoFocus={autoFocus}
        returnKeyType={returnKeyType}
      />
      {canClear ? (
        <Pressable
          testID={clearButtonTestID}
          accessibilityRole="button"
          accessibilityLabel="Clear search"
          hitSlop={CLEAR_BUTTON_HIT_SLOP}
          style={styles.clearButton}
          onPress={handleClear}
        >
          <Ionicons name="close-circle" size={16} color={clearIconColor} />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
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
  input: {
    flex: 1,
    fontFamily: font.sans,
    fontSize: 13,
    color: colors.ink
  },
  clearButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center"
  }
});
