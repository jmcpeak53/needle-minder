import { useState } from "react";
import { Alert, Pressable, Text, TextInput, View } from "react-native";

import { useNeedleMinder } from "../src/state/NeedleMinderContext";
import { ColorSwatch } from "../src/ui/ColorSwatch";
import { PrimaryButton } from "../src/ui/PrimaryButton";
import { Screen } from "../src/ui/Screen";
import { colors, spacing } from "../src/ui/theme";
import type { InventoryItem } from "../src/types";

export default function InventoryScreen() {
  const { ready, inventory, decrementInventory, removeInventory, updateInventory } = useNeedleMinder();
  const [editing, setEditing] = useState<InventoryItem | null>(null);

  if (!ready) {
    return (
      <Screen>
        <Text>Loading inventory...</Text>
      </Screen>
    );
  }

  return (
    <Screen>
      <Text style={{ color: colors.ink, fontSize: 30, fontWeight: "800" }}>Needle Minder</Text>
      <Text style={{ color: colors.muted, fontSize: 16 }}>
        {inventory.length === 0 ? "No skeins logged yet." : `${inventory.length} inventory rows`}
      </Text>

      {inventory.map((item) => (
        <View
          key={item.id}
          style={{
            backgroundColor: colors.surface,
            borderColor: colors.border,
            borderRadius: 8,
            borderWidth: 1,
            gap: spacing.md,
            padding: spacing.lg
          }}
        >
          <View style={{ flexDirection: "row", gap: spacing.md, alignItems: "center" }}>
            <ColorSwatch color={item.referenceColor.hexRgb} />
            <View style={{ flex: 1 }}>
              <Text style={{ color: colors.ink, fontSize: 18, fontWeight: "700" }}>
                {item.referenceColor.colorCode} {item.referenceColor.colorName}
              </Text>
              <Text style={{ color: colors.muted }}>
                {item.quantity} {item.quantity === 1 ? "skein" : "skeins"} · {item.condition}
              </Text>
            </View>
          </View>

          {item.notes ? <Text style={{ color: colors.muted }}>{item.notes}</Text> : null}

          <View style={{ flexDirection: "row", gap: spacing.sm, flexWrap: "wrap" }}>
            <Pressable onPress={() => decrementInventory(item.id)} style={pillStyle}>
              <Text>Use one</Text>
            </Pressable>
            <Pressable onPress={() => setEditing(item)} style={pillStyle}>
              <Text>Edit</Text>
            </Pressable>
            <Pressable
              onPress={() => {
                Alert.alert("Remove skein?", `${item.referenceColor.colorCode} ${item.referenceColor.colorName}`, [
                  { text: "Cancel", style: "cancel" },
                  { text: "Remove", style: "destructive", onPress: () => removeInventory(item.id) }
                ]);
              }}
              style={pillStyle}
            >
              <Text>Remove</Text>
            </Pressable>
          </View>
        </View>
      ))}

      {editing ? (
        <EditInventoryPanel
          item={editing}
          onCancel={() => setEditing(null)}
          onSave={async (item) => {
            await updateInventory(item);
            setEditing(null);
          }}
        />
      ) : null}
    </Screen>
  );
}

function EditInventoryPanel({
  item,
  onCancel,
  onSave
}: {
  item: InventoryItem;
  onCancel: () => void;
  onSave: (item: InventoryItem) => Promise<void>;
}) {
  const [quantity, setQuantity] = useState(String(item.quantity));
  const [condition, setCondition] = useState(item.condition);
  const [notes, setNotes] = useState(item.notes ?? "");

  return (
    <View style={{ backgroundColor: colors.surface, borderRadius: 8, gap: spacing.md, padding: spacing.lg }}>
      <Text style={{ color: colors.ink, fontSize: 20, fontWeight: "800" }}>Edit inventory</Text>
      <TextInput
        keyboardType="number-pad"
        onChangeText={setQuantity}
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
        label="Save"
        onPress={() =>
          onSave({
            ...item,
            quantity: Number(quantity),
            condition,
            notes
          })
        }
      />
      <PrimaryButton label="Cancel" onPress={onCancel} variant="secondary" />
    </View>
  );
}

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

const inputStyle = {
  backgroundColor: colors.surface,
  borderColor: colors.border,
  borderRadius: 6,
  borderWidth: 1,
  color: colors.ink,
  fontSize: 16,
  padding: spacing.md
};
