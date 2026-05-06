import { View } from "react-native";

export function ColorSwatch({ color }: { color: string }) {
  return (
    <View
      accessibilityLabel={`Thread color ${color}`}
      style={{
        width: 28,
        height: 28,
        borderRadius: 4,
        backgroundColor: color,
        borderColor: "#4A403A",
        borderWidth: 1
      }}
    />
  );
}
