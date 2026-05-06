import { useMemo, useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";

import { useNeedleMinder } from "../src/app/NeedleMinderContext";
import { ColorSwatch } from "../src/ui/ColorSwatch";
import { PrimaryButton } from "../src/ui/PrimaryButton";
import { Screen } from "../src/ui/Screen";
import { colors, spacing } from "../src/ui/theme";
import type { ReferenceColor, ThreadCondition } from "../src/types";

export default function AddScreen() {
  const { ready, catalog, addInventory } = useNeedleMinder();
  const [query, setQuery] = useState("");
  const [selectedColor, setSelectedColor] = useState<ReferenceColor | null>(null);
  const [quantity, setQuantity] = useState("1");
  const [condition, setCondition] = useState<ThreadCondition>("full");
  const [notes, setNotes] = useState("");

  const results = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) {
      return catalog;
    }

    return catalog.filter((color) => {
      return (
        color.colorCode.toLowerCase().includes(normalized) ||
        color.colorName.toLowerCase().includes(normalized) ||
        color.colorFamily.toLowerCase().includes(normalized)
      );
    });
  }, [catalog, query]);

  if (!ready) {
    return (
      <Screen>
        <Text>Loading catalog...</Text>
      </Screen>
    );
  }

  return (
    <Screen>
      <Text style={{ color: colors.ink, fontSize: 26, fontWeight: "800" }}>Add manually</Text>
      <TextInput
        onChangeText={setQuery}
        placeholder="Search by number, name, or family"
        style={inputStyle}
        value={query}
      />

      {selectedColor ? (
        <View style={{ backgroundColor: colors.surface, borderRadius: 8, gap: spacing.md, padding: spacing.lg }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.md }}>
            <ColorSwatch color={selectedColor.hexRgb} />
            <View style={{ flex: 1 }}>
              <Text style={{ color: colors.ink, fontSize: 18, fontWeight: "800" }}>
                {selectedColor.colorCode} {selectedColor.colorName}
              </Text>
              <Text style={{ color: colors.muted }}>{selectedColor.colorFamily}</Text>
            </View>
          </View>
          <TextInput
            keyboardType="number-pad"
            onChangeText={setQuantity}
            placeholder="Quantity"
            style={inputStyle}
            value={quantity}
          />
          <View style={{ flexDirection: "row", gap: spacing.sm }}>
            <Pressable onPress={() => setCondition("full")} style={condition === "full" ? selectedPillStyle : pillStyle}>
              <Text>Full</Text>
            </Pressable>
            <Pressable
              onPress={() => setCondition("partial")}
              style={condition === "partial" ? selectedPillStyle : pillStyle}
            >
              <Text>Partial</Text>
            </Pressable>
          </View>
          <TextInput
            multiline
            onChangeText={setNotes}
            placeholder="Notes"
            style={[inputStyle, { minHeight: 72 }]}
            value={notes}
          />
          <PrimaryButton
            label="Save to inventory"
            onPress={async () => {
              await addInventory({
                referenceColorId: selectedColor.id,
                quantity: Number(quantity),
                condition,
                notes
              });
              setSelectedColor(null);
              setQuantity("1");
              setCondition("full");
              setNotes("");
            }}
          />
        </View>
      ) : null}

      {results.map((color) => (
        <Pressable
          key={color.id}
          onPress={() => setSelectedColor(color)}
          style={{
            backgroundColor: colors.surface,
            borderColor: colors.border,
            borderRadius: 8,
            borderWidth: 1,
            flexDirection: "row",
            gap: spacing.md,
            padding: spacing.md
          }}
        >
          <ColorSwatch color={color.hexRgb} />
          <View>
            <Text style={{ color: colors.ink, fontSize: 17, fontWeight: "700" }}>
              {color.colorCode} {color.colorName}
            </Text>
            <Text style={{ color: colors.muted }}>{color.colorFamily}</Text>
          </View>
        </Pressable>
      ))}
    </Screen>
  );
}

const inputStyle = {
  backgroundColor: colors.surface,
  borderColor: colors.border,
  borderRadius: 6,
  borderWidth: 1,
  color: colors.ink,
  fontSize: 16,
  padding: spacing.md
};

const pillStyle = {
  borderColor: colors.border,
  borderRadius: 6,
  borderWidth: 1,
  paddingHorizontal: spacing.md,
  paddingVertical: spacing.sm
};

const selectedPillStyle = {
  ...pillStyle,
  backgroundColor: "#F4D9D9",
  borderColor: colors.accent
};
