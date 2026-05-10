import { Ionicons } from "@expo/vector-icons";
import { useMemo, useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { buildCatalogFilterOptions } from "../../src/catalog/catalogFilter";
import { BackupValidationError } from "../../src/backup/envelope";
import { useBackup } from "../../src/state/BackupContext";
import { useCatalog } from "../../src/state/CatalogContext";
import { colors, font, NAV_HEIGHT, radius, spacing } from "../../src/ui/theme";

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const {
    threadTypes,
    defaultCatalogFilter,
    sessionCatalogThreadTypeId,
    setDefaultCatalogFilter,
    clearSessionCatalogThreadTypeId,
    getThreadTypeDisplayName
  } = useCatalog();
  const { exportBackup, importBackup } = useBackup();
  const [showCatalogOptions, setShowCatalogOptions] = useState(false);
  const [backupBusy, setBackupBusy] = useState(false);

  async function handleExport() {
    setBackupBusy(true);
    try {
      await exportBackup();
    } catch (error) {
      Alert.alert("Export failed", error instanceof Error ? error.message : "Unknown error.");
    } finally {
      setBackupBusy(false);
    }
  }

  function handleImport() {
    Alert.alert(
      "Restore from backup",
      "This will replace all current inventory, projects, and settings with the contents of the backup file. Continue?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Restore",
          style: "destructive",
          onPress: async () => {
            setBackupBusy(true);
            try {
              const result = await importBackup();
              if (result.kind === "canceled") return;
              const { inserted, warnings } = result.result;
              const summary = [
                `Restored ${inserted.user_inventory} skein(s), ${inserted.projects} project(s).`,
                ...warnings
              ].join("\n");
              Alert.alert("Restore complete", summary);
            } catch (error) {
              const message =
                error instanceof BackupValidationError
                  ? error.message
                  : "Restore failed. The backup file may be corrupt.";
              Alert.alert("Restore failed", message);
            } finally {
              setBackupBusy(false);
            }
          }
        }
      ]
    );
  }

  const filterOptions = useMemo(() => buildCatalogFilterOptions(threadTypes), [threadTypes]);
  const activeCatalogLabel =
    filterOptions.find((option) => option.value === defaultCatalogFilter)?.label ?? "All catalogs";
  const activeSessionLabel = sessionCatalogThreadTypeId
    ? getThreadTypeDisplayName(sessionCatalogThreadTypeId)
    : "None saved";

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <ScrollView contentContainerStyle={[styles.scroll, { paddingBottom: NAV_HEIGHT + 24 }]}>
        <Text style={styles.title}>Settings</Text>

        <View style={styles.card}>
          <Text style={styles.cardHeading}>Default catalog</Text>
          <Text style={styles.cardBody}>
            Controls which catalog opens first in manual add and project thread reservation screens.
          </Text>

          <Pressable style={styles.settingRow} onPress={() => setShowCatalogOptions((value) => !value)}>
            <View style={styles.settingMeta}>
              <Text style={styles.settingLabel}>Current default</Text>
              <Text style={styles.settingValue}>{activeCatalogLabel}</Text>
            </View>
            <Ionicons
              name={showCatalogOptions ? "chevron-up" : "chevron-down"}
              size={16}
              color={colors.ink3}
            />
          </Pressable>

          {showCatalogOptions ? (
            <View style={styles.optionList}>
              {filterOptions.map((option) => {
                const active = option.value === defaultCatalogFilter;
                return (
                  <Pressable
                    key={option.value}
                    style={[styles.optionRow, active && styles.optionRowActive]}
                    onPress={async () => {
                      await setDefaultCatalogFilter(option.value);
                      setShowCatalogOptions(false);
                    }}
                  >
                    <View style={styles.settingMeta}>
                      <Text style={[styles.optionLabel, active && styles.optionLabelActive]}>{option.label}</Text>
                      {option.productLine ? (
                        <Text style={styles.optionMeta}>
                          {option.manufacturer} · {option.productLine}
                        </Text>
                      ) : null}
                    </View>
                    {active ? <Ionicons name="checkmark" size={16} color={colors.card} /> : null}
                  </Pressable>
                );
              })}
            </View>
          ) : null}
        </View>

        <View style={styles.card}>
          <Text style={styles.cardHeading}>Scan session catalog</Text>
          <Text style={styles.cardBody}>
            When you save a duplicate-code catalog during scanning, it is reused automatically until cleared.
          </Text>

          <View style={styles.settingRowStatic}>
            <View style={styles.settingMeta}>
              <Text style={styles.settingLabel}>Saved session catalog</Text>
              <Text style={styles.settingValue}>{activeSessionLabel}</Text>
            </View>
          </View>

          <Pressable
            style={[styles.buttonRow, !sessionCatalogThreadTypeId && styles.buttonRowDisabled]}
            disabled={!sessionCatalogThreadTypeId}
            onPress={clearSessionCatalogThreadTypeId}
          >
            <Ionicons name="refresh" size={16} color={sessionCatalogThreadTypeId ? colors.accent : colors.ink4} />
            <Text style={[styles.buttonText, !sessionCatalogThreadTypeId && styles.buttonTextDisabled]}>
              Clear session catalog
            </Text>
          </Pressable>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardHeading}>Backup</Text>
          <Text style={styles.cardBody}>
            Export your stash, projects, and settings to a file. Import a backup to restore them after a reinstall.
          </Text>

          <Pressable
            style={[styles.buttonRow, backupBusy && styles.buttonRowDisabled]}
            disabled={backupBusy}
            onPress={handleExport}
          >
            <Ionicons name="share-outline" size={16} color={backupBusy ? colors.ink4 : colors.accent} />
            <Text style={[styles.buttonText, backupBusy && styles.buttonTextDisabled]}>
              Export Backup
            </Text>
          </Pressable>

          <Pressable
            style={[styles.buttonRow, backupBusy && styles.buttonRowDisabled]}
            disabled={backupBusy}
            onPress={handleImport}
          >
            <Ionicons name="download-outline" size={16} color={backupBusy ? colors.ink4 : colors.accent} />
            <Text style={[styles.buttonText, backupBusy && styles.buttonTextDisabled]}>
              Import Backup
            </Text>
          </Pressable>
        </View>

        <InfoCard
          heading="Catalog support"
          body="Needle Minder currently includes DMC Six-Strand Embroidery Floss and DMC Pearl Cotton Size 5 reference catalogs."
        />
        <InfoCard
          heading="Offline storage"
          body="Inventory is stored locally on this device using SQLite. Export a backup from this screen to preserve your data across reinstalls."
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
  cardBody: { fontFamily: font.sans, fontSize: 14, color: colors.ink3, lineHeight: 20 },
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 10
  },
  settingRowStatic: {
    paddingVertical: 10
  },
  settingMeta: {
    flex: 1
  },
  settingLabel: {
    fontFamily: font.mono,
    fontSize: 11,
    color: colors.ink4,
    textTransform: "uppercase",
    letterSpacing: 0.6
  },
  settingValue: {
    fontFamily: font.sansMedium,
    fontSize: 14,
    color: colors.ink,
    marginTop: 4
  },
  optionList: {
    gap: spacing.sm,
    paddingTop: spacing.xs
  },
  optionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.rule,
    backgroundColor: colors.card2
  },
  optionRowActive: {
    backgroundColor: colors.ink,
    borderColor: colors.ink
  },
  optionLabel: {
    fontFamily: font.sansSemiBold,
    fontSize: 14,
    color: colors.ink
  },
  optionLabelActive: {
    color: colors.card
  },
  optionMeta: {
    fontFamily: font.sans,
    fontSize: 12,
    color: colors.ink4,
    marginTop: 2
  },
  buttonRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    paddingVertical: 11,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.accentSoft,
    backgroundColor: colors.accentTint
  },
  buttonRowDisabled: {
    borderColor: colors.ruleSoft,
    backgroundColor: colors.card2
  },
  buttonText: {
    fontFamily: font.sansSemiBold,
    fontSize: 13,
    color: colors.accent
  },
  buttonTextDisabled: {
    color: colors.ink4
  }
});
