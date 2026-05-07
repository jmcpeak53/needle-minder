import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { colors, font, NAV_HEIGHT, radius, spacing } from "../../src/ui/theme";

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <ScrollView contentContainerStyle={[styles.scroll, { paddingBottom: NAV_HEIGHT + 24 }]}>
        <Text style={styles.title}>Settings</Text>
        <InfoCard
          heading="Catalog"
          body="V1 supports DMC Six-Strand Embroidery Floss. The full DMC catalog will be audited and imported before v1 release."
        />
        <InfoCard
          heading="Offline storage"
          body="Inventory is stored locally on this device using SQLite. There is no account, backend, or cloud sync in v1."
        />
        <InfoCard
          heading="Scanning"
          body="OCR runs on the device. Every scanned match must be confirmed before it is saved to your stash."
        />
      </ScrollView>
    </View>
  );
}

function InfoCard({ heading, body }: { heading: string; body: string }) {
  return (
    <View style={styles.card}>
      <Text style={styles.cardHeading}>{heading}</Text>
      <Text style={styles.cardBody}>{body}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  scroll: { paddingHorizontal: spacing.lg, gap: spacing.md },
  title: {
    fontFamily: font.serif,
    fontSize: 28,
    color: colors.ink,
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.rule,
    padding: spacing.lg,
    gap: spacing.sm
  },
  cardHeading: { fontFamily: font.sansSemiBold, fontSize: 16, color: colors.ink },
  cardBody: { fontFamily: font.sans, fontSize: 14, color: colors.ink3, lineHeight: 20 }
});
