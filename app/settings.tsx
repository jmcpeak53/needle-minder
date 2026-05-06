import { Text, View } from "react-native";

import { Screen } from "../src/ui/Screen";
import { colors, spacing } from "../src/ui/theme";

export default function SettingsScreen() {
  return (
    <Screen>
      <Text style={{ color: colors.ink, fontSize: 26, fontWeight: "800" }}>Settings</Text>
      <View style={{ backgroundColor: colors.surface, borderRadius: 8, gap: spacing.sm, padding: spacing.lg }}>
        <Text style={{ color: colors.ink, fontSize: 18, fontWeight: "800" }}>Catalog</Text>
        <Text style={{ color: colors.muted }}>
          V1 is limited to DMC Six-Strand Embroidery Floss. This build includes a small development fixture until
          the full DMC catalog is audited and imported.
        </Text>
      </View>
      <View style={{ backgroundColor: colors.surface, borderRadius: 8, gap: spacing.sm, padding: spacing.lg }}>
        <Text style={{ color: colors.ink, fontSize: 18, fontWeight: "800" }}>Offline storage</Text>
        <Text style={{ color: colors.muted }}>
          Inventory is stored locally on this device using SQLite. There is no account, backend, or cloud sync in v1.
        </Text>
      </View>
      <View style={{ backgroundColor: colors.surface, borderRadius: 8, gap: spacing.sm, padding: spacing.lg }}>
        <Text style={{ color: colors.ink, fontSize: 18, fontWeight: "800" }}>Scanning</Text>
        <Text style={{ color: colors.muted }}>
          OCR runs on the device and every scanned match must be confirmed before it is saved.
        </Text>
      </View>
    </Screen>
  );
}
