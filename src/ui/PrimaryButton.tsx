import { Pressable, Text } from "react-native";

import { colors, spacing } from "./theme";

export function PrimaryButton({
  label,
  onPress,
  variant = "primary"
}: {
  label: string;
  onPress: () => void;
  variant?: "primary" | "secondary" | "danger";
}) {
  const backgroundColor =
    variant === "secondary" ? colors.surface : variant === "danger" ? colors.accentDark : colors.accent;
  const color = variant === "secondary" ? colors.ink : colors.surface;

  return (
    <Pressable
      onPress={onPress}
      style={{
        backgroundColor,
        borderColor: variant === "secondary" ? colors.border : backgroundColor,
        borderRadius: 6,
        borderWidth: 1,
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.md,
        alignItems: "center"
      }}
    >
      <Text style={{ color, fontSize: 16, fontWeight: "700" }}>{label}</Text>
    </Pressable>
  );
}
