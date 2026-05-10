import { Ionicons } from "@expo/vector-icons";
import { CameraView, useCameraPermissions } from "expo-camera";
import { useRouter } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import type { ScanResolution } from "../../src/scan/scanResolution";
import { resolveScanCandidate } from "../../src/scan/scanResolution";
import type { ConfirmState } from "../../src/scan/useScanFlow";
import { useScanFlow } from "../../src/scan/useScanFlow";
import { InventoryForm } from "../../src/ui/InventoryForm";
import { KeyboardAwareBody } from "../../src/ui/KeyboardAwareBody";
import { SkeinBall } from "../../src/ui/SkeinBall";
import { colors, font, NAV_HEIGHT, radius, spacing } from "../../src/ui/theme";
import type { OcrCandidate, ReferenceColor, ThreadType } from "../../src/types";

export default function ScanScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const {
    cameraRef,
    candidates,
    rawText,
    scanError,
    setScanError,
    isScanning,
    confirming,
    setConfirming,
    catalogChoice,
    saveForSession,
    setSaveForSession,
    selectionToast,
    saved,
    capture,
    addToStash,
    chooseCatalogMatch,
    reset,
    catalog,
    threadTypes,
    sessionCatalogThreadTypeId
  } = useScanFlow();

  // Permission gate
  if (!permission) {
    return <View style={[styles.screen, { paddingTop: insets.top }]} />;
  }

  if (!permission.granted) {
    return (
      <View style={[styles.screen, styles.permScreen, { paddingTop: insets.top }]}>
        <Pressable onPress={() => router.back()} style={[styles.backBtn, { top: insets.top + 8 }]}>
          <Ionicons name="chevron-back" size={20} color={colors.card} />
        </Pressable>
        <View style={[styles.permContent, { paddingBottom: insets.bottom + NAV_HEIGHT + spacing.lg }]}>
          <Text style={styles.permTitle}>Camera access</Text>
          <Text style={styles.permBody}>
            Skein uses your camera to read the color number printed on thread labels.
          </Text>
          <Pressable style={styles.permBtn} onPress={requestPermission}>
            <Text style={styles.permBtnText}>Allow camera</Text>
          </Pressable>
          <Pressable style={styles.permBtnSecondary} onPress={() => router.push("/add")}>
            <Text style={styles.permBtnSecondaryText}>Add manually instead</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  if (catalogChoice) {
    return (
      <View style={[styles.screen, { paddingTop: insets.top }]}>
        <View style={styles.confirmBar}>
          <Pressable onPress={reset} style={styles.iconBtn}>
            <Ionicons name="chevron-back" size={18} color={colors.ink2} />
          </Pressable>
          <View style={styles.confirmBarCenter}>
            <Text style={styles.confirmBarTitle}>Choose catalog</Text>
            <Text style={styles.confirmBarSub}>Code {catalogChoice.candidate.colorCode} appears in more than one catalog</Text>
          </View>
          <Pressable onPress={reset} style={styles.iconBtn}>
            <Ionicons name="close" size={18} color={colors.ink2} />
          </Pressable>
        </View>

        <ScrollView
          contentContainerStyle={[styles.confirmScroll, { paddingBottom: insets.bottom + 40 }]}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.choiceIntro}>
            Select the thread catalog for this skein. You can save the choice for the rest of this session.
          </Text>

          {catalogChoice.matches.map((match) => (
            <Pressable
              key={match.color.id}
              style={styles.choiceRow}
              onPress={() => chooseCatalogMatch(match)}
            >
              <SkeinBall color={match.color.hexRgb} size={42} />
              <View style={styles.choiceMeta}>
                <Text style={styles.choiceTitle}>{match.threadType.displayName}</Text>
                <Text style={styles.choiceBody}>
                  {match.color.colorCode} · {match.color.colorName}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={colors.ink4} />
            </Pressable>
          ))}

          <Pressable style={styles.sessionRow} onPress={() => setSaveForSession((value) => !value)}>
            <View style={[styles.sessionCheckbox, saveForSession && styles.sessionCheckboxChecked]}>
              {saveForSession ? <Ionicons name="checkmark" size={14} color={colors.card} /> : null}
            </View>
            <View style={styles.choiceMeta}>
              <Text style={styles.choiceTitle}>Save for session</Text>
              <Text style={styles.choiceBody}>Use this catalog automatically for matching scans until it is cleared.</Text>
            </View>
          </Pressable>
        </ScrollView>
      </View>
    );
  }

  // Confirm flow (after scan)
  if (confirming) {
    return (
      <View style={[styles.screen, { paddingTop: insets.top }]}>
        {/* Confirm app bar */}
        <View style={styles.confirmBar}>
          <Pressable onPress={reset} style={styles.iconBtn}>
            <Ionicons name="chevron-back" size={18} color={colors.ink2} />
          </Pressable>
          <View style={styles.confirmBarCenter}>
            <Text style={styles.confirmBarTitle}>Confirm skein</Text>
            <Text style={styles.confirmBarSub}>Label read · 4 of 4 fields</Text>
          </View>
          <Pressable onPress={reset} style={styles.iconBtn}>
            <Ionicons name="close" size={18} color={colors.ink2} />
          </Pressable>
        </View>

        <KeyboardAwareBody
          testID="scan-confirm-keyboard-body"
          scrollTestID="scan-confirm-keyboard-scroll"
          contentBottomPadding={120}
          contentContainerStyle={styles.confirmScroll}
          keyboardDismissMode="none"
        >
          {/* Preview */}
          <View style={styles.confirmPreview}>
            <View style={styles.confirmThumb}>
              <SkeinBall color={confirming.color.hexRgb} size={72} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.confirmColorName}>{confirming.color.colorName}</Text>
              <Text style={styles.confirmColorSub}>Photo captured</Text>
              <View style={styles.badgeOk}>
                <Text style={styles.badgeOkText}>✓ 4 of 4 read</Text>
              </View>
            </View>
          </View>

          {selectionToast ? (
            <View style={styles.selectionToast}>
              <Text style={styles.selectionToastText}>{selectionToast}</Text>
            </View>
          ) : null}

          <ConfirmField
            label="Catalog"
            value={
              threadTypes.find((threadType) => threadType.id === confirming.color.threadTypeId)?.displayName ??
              confirming.color.threadTypeId
            }
            detected
          />
          <ConfirmField label="Color number" value={confirming.color.colorCode} detected mono />
          <ConfirmField label="Color name" value={confirming.color.colorName} detected />

          <View style={styles.formWrap}>
            <InventoryForm
              quantity={confirming.quantity}
              onQuantityChange={(quantity) => setConfirming((c) => c && { ...c, quantity })}
              condition={confirming.condition}
              onConditionChange={(condition) => setConfirming((c) => c && { ...c, condition })}
              favorite={confirming.favorite}
              onFavoriteChange={(favorite) => setConfirming((c) => c && { ...c, favorite })}
              notes={confirming.notes}
              onNotesChange={(notes) => setConfirming((c) => c && { ...c, notes })}
            />
          </View>

          {/* Other candidates */}
          {candidates.length > 1 && (
            <AltCandidates
              candidates={candidates.slice(1)}
              confirming={confirming}
              catalog={catalog}
              threadTypes={threadTypes}
              sessionCatalogThreadTypeId={sessionCatalogThreadTypeId}
              onSelect={(col, cand, resolution) => {
                setConfirming({
                  candidate: cand,
                  color: col,
                  quantity: confirming.quantity,
                  condition: confirming.condition,
                  favorite: confirming.favorite,
                  notes: confirming.notes,
                  selectionToast: resolution.selectionToast
                });
              }}
            />
          )}
        </KeyboardAwareBody>

        {/* Bottom action row */}
        <View style={[styles.confirmActions, { bottom: insets.bottom + 16 }]}>
          <Pressable style={[styles.actionBtn, styles.actionBtnGhost]} onPress={reset}>
            <Ionicons name="add-circle-outline" size={16} color={colors.ink} />
            <Text style={styles.actionBtnTextGhost}>Scan another</Text>
          </Pressable>
          <Pressable style={[styles.actionBtn, styles.actionBtnPrimary]} onPress={addToStash}>
            <Text style={styles.actionBtnTextPrimary}>Add to stash</Text>
            <Ionicons name="checkmark" size={16} color={colors.card} />
          </Pressable>
        </View>
      </View>
    );
  }

  // Camera viewfinder
  return (
    <View style={styles.viewfinder}>
      <CameraView
        ref={cameraRef}
        style={StyleSheet.absoluteFill}
        facing="back"
        barcodeScannerSettings={{ barcodeTypes: ["ean13", "upc_a"] }}
      />

      {/* Scan hint */}
      <View style={styles.vfHint}>
        <View style={[styles.vfHintDot, !isScanning && styles.vfHintDotReady]} />
        <Text style={styles.vfHintText}>
          {isScanning ? "Reading label…" : "Point at the skein label"}
        </Text>
      </View>

      {/* Corner guides */}
      <View style={[styles.corner, styles.cornerTL]} />
      <View style={[styles.corner, styles.cornerTR]} />
      <View style={[styles.corner, styles.cornerBL]} />
      <View style={[styles.corner, styles.cornerBR]} />

      {/* Capture bar */}
      <View style={[styles.captureBar, { bottom: insets.bottom + 30 }]}>
        <Pressable style={styles.vfSmallBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={20} color={colors.card} />
        </Pressable>

        <Pressable style={styles.shutter} onPress={capture} disabled={isScanning}>
          <View style={[styles.shutterCore, isScanning && { opacity: 0.6 }]} />
        </Pressable>

        {saved ? (
          <View style={styles.vfSmallBtn}>
            <Ionicons name="checkmark" size={18} color="#b6d47a" />
          </View>
        ) : (
          <Pressable style={styles.vfSmallBtn} onPress={() => router.push("/add")}>
            <Ionicons name="create-outline" size={18} color={colors.card} />
          </Pressable>
        )}
      </View>

      {/* Error toast */}
      {scanError && (
        <Pressable style={[styles.errorToast, { bottom: insets.bottom + 110 }]} onPress={() => setScanError(null)}>
          <Text style={styles.errorToastText}>{scanError}</Text>
        </Pressable>
      )}

      {/* No-match fallback */}
      {rawText.length > 0 && candidates.length === 0 && !scanError && (
        <View style={[styles.noMatchCard, { bottom: insets.bottom + 110 }]}>
          <Text style={styles.noMatchTitle}>No catalog match</Text>
          <Pressable onPress={() => router.push("/add")}>
            <Text style={styles.noMatchLink}>Add manually →</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

function AltCandidates({
  candidates,
  confirming,
  catalog,
  threadTypes,
  sessionCatalogThreadTypeId,
  onSelect
}: {
  candidates: OcrCandidate[];
  confirming: ConfirmState;
  catalog: ReferenceColor[];
  threadTypes: ThreadType[];
  sessionCatalogThreadTypeId: string | null;
  onSelect: (color: ReferenceColor, candidate: OcrCandidate, resolution: ScanResolution & { mode: "confirm" }) => void;
}) {
  return (
    <View style={styles.altSection}>
      <Text style={styles.altLabel}>Other possible matches</Text>
      {candidates.map((cand) => {
        const resolution = resolveScanCandidate({ candidate: cand, catalog, threadTypes, sessionCatalogThreadTypeId });
        if (!resolution || resolution.mode !== "confirm") return null;
        const col = resolution.color;
        return (
          <Pressable
            key={`${cand.colorCode}-${col.id}`}
            style={styles.altRow}
            onPress={() => onSelect(col, cand, resolution)}
          >
            <SkeinBall color={col.hexRgb} size={32} />
            <Text style={styles.altRowText}>{col.colorCode} {col.colorName}</Text>
            <Text style={styles.altRowConf}>{cand.confidence}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function ConfirmField({
  label,
  value,
  detected = false,
  mono = false
}: {
  label: string;
  value: string;
  detected?: boolean;
  mono?: boolean;
}) {
  return (
    <View style={styles.confirmField}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={styles.fieldRow}>
        <Text style={[styles.fieldValue, mono && styles.fieldValueMono]}>{value}</Text>
        {detected && (
          <View style={styles.badgeOk}>
            <Text style={styles.badgeOkText}>Detected</Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bg
  },
  // Permission screen
  permScreen: {
    backgroundColor: "#0f0d0a",
    justifyContent: "flex-end"
  },
  backBtn: {
    position: "absolute",
    left: spacing.lg,
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "rgba(250,246,236,0.12)",
    alignItems: "center",
    justifyContent: "center"
  },
  permContent: {
    backgroundColor: colors.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: spacing.xl,
    gap: spacing.md
  },
  permTitle: {
    fontFamily: font.serif,
    fontSize: 26,
    color: colors.ink
  },
  permBody: {
    fontFamily: font.sans,
    fontSize: 14,
    color: colors.ink3,
    lineHeight: 20
  },
  permBtn: {
    backgroundColor: colors.ink,
    borderRadius: radius.md,
    paddingVertical: 12,
    alignItems: "center"
  },
  permBtnText: {
    fontFamily: font.sansSemiBold,
    fontSize: 14,
    color: colors.card
  },
  permBtnSecondary: {
    alignItems: "center",
    paddingVertical: 8
  },
  permBtnSecondaryText: {
    fontFamily: font.sans,
    fontSize: 13,
    color: colors.ink3
  },
  // Viewfinder
  viewfinder: {
    flex: 1,
    backgroundColor: "#0f0d0a"
  },
  vfHint: {
    position: "absolute",
    top: 88,
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(15,13,10,0.6)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999
  },
  vfHintDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.ink4
  },
  vfHintDotReady: {
    backgroundColor: "#b6d47a"
  },
  vfHintText: {
    fontFamily: font.sans,
    fontSize: 12,
    color: colors.card
  },
  corner: {
    position: "absolute",
    width: 28,
    height: 28,
    borderColor: "rgba(250,246,236,0.9)",
    borderRadius: 4,
    top: "30%"
  },
  cornerTL: {
    top: "28%",
    left: 24,
    borderTopWidth: 2,
    borderLeftWidth: 2,
    borderTopLeftRadius: 10
  },
  cornerTR: {
    top: "28%",
    right: 24,
    borderTopWidth: 2,
    borderRightWidth: 2,
    borderTopRightRadius: 10
  },
  cornerBL: {
    top: "58%",
    left: 24,
    borderBottomWidth: 2,
    borderLeftWidth: 2,
    borderBottomLeftRadius: 10
  },
  cornerBR: {
    top: "58%",
    right: 24,
    borderBottomWidth: 2,
    borderRightWidth: 2,
    borderBottomRightRadius: 10
  },
  captureBar: {
    position: "absolute",
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 28
  },
  vfSmallBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "rgba(250,246,236,0.12)",
    alignItems: "center",
    justifyContent: "center"
  },
  shutter: {
    width: 66,
    height: 66,
    borderRadius: 33,
    borderWidth: 3,
    borderColor: colors.card,
    alignItems: "center",
    justifyContent: "center"
  },
  shutterCore: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.card
  },
  errorToast: {
    position: "absolute",
    left: 14,
    right: 14,
    backgroundColor: "rgba(15,13,10,0.8)",
    borderRadius: radius.lg,
    padding: 12,
    alignItems: "center"
  },
  errorToastText: {
    fontFamily: font.sans,
    fontSize: 13,
    color: colors.card,
    textAlign: "center"
  },
  noMatchCard: {
    position: "absolute",
    left: 14,
    right: 14,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between"
  },
  noMatchTitle: {
    fontFamily: font.sansSemiBold,
    fontSize: 14,
    color: colors.ink
  },
  noMatchLink: {
    fontFamily: font.sans,
    fontSize: 13,
    color: colors.accent
  },
  choiceIntro: {
    fontFamily: font.sans,
    fontSize: 13,
    color: colors.ink3,
    lineHeight: 19,
    marginBottom: spacing.md
  },
  choiceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.rule,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm
  },
  choiceMeta: {
    flex: 1
  },
  choiceTitle: {
    fontFamily: font.sansSemiBold,
    fontSize: 14,
    color: colors.ink
  },
  choiceBody: {
    fontFamily: font.sans,
    fontSize: 12,
    color: colors.ink3,
    marginTop: 2,
    lineHeight: 17
  },
  sessionRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    backgroundColor: colors.card2,
    borderWidth: 1,
    borderColor: colors.ruleSoft,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginTop: spacing.sm
  },
  sessionCheckbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.rule,
    backgroundColor: colors.card,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2
  },
  sessionCheckboxChecked: {
    backgroundColor: colors.ink,
    borderColor: colors.ink
  },
  // Confirm screen
  confirmBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md
  },
  confirmBarCenter: {
    flex: 1
  },
  confirmBarTitle: {
    fontFamily: font.serif,
    fontSize: 22,
    color: colors.ink,
    lineHeight: 24
  },
  confirmBarSub: {
    fontFamily: font.sans,
    fontSize: 11,
    color: colors.ink3,
    marginTop: 2
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center"
  },
  confirmScroll: {
    paddingHorizontal: spacing.lg
  },
  confirmPreview: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingBottom: 12
  },
  confirmThumb: {
    borderRadius: radius.lg,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.rule
  },
  confirmColorName: {
    fontFamily: font.serif,
    fontSize: 20,
    color: colors.ink,
    lineHeight: 22
  },
  confirmColorSub: {
    fontFamily: font.sans,
    fontSize: 12,
    color: colors.ink3,
    marginTop: 3
  },
  selectionToast: {
    backgroundColor: colors.infoSoft,
    borderWidth: 1,
    borderColor: colors.info,
    borderRadius: radius.md,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginBottom: 12
  },
  selectionToastText: {
    fontFamily: font.sansMedium,
    fontSize: 12,
    color: colors.info
  },
  badgeOk: {
    backgroundColor: "#e1ebdb",
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    alignSelf: "flex-start",
    marginTop: 6
  },
  badgeOkText: {
    fontFamily: font.sansBold,
    fontSize: 9,
    color: colors.ok,
    letterSpacing: 0.5,
    textTransform: "uppercase"
  },
  confirmField: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.ruleSoft
  },
  fieldLabel: {
    fontFamily: font.mono,
    fontSize: 11,
    color: colors.ink4,
    letterSpacing: 0.8,
    textTransform: "uppercase"
  },
  fieldRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 3
  },
  fieldValue: {
    fontFamily: font.sansMedium,
    fontSize: 16,
    color: colors.ink
  },
  fieldValueMono: {
    fontFamily: font.mono
  },
  formWrap: {
    paddingVertical: spacing.md
  },
  altSection: {
    marginTop: 16
  },
  altLabel: {
    fontFamily: font.mono,
    fontSize: 10,
    color: colors.ink4,
    letterSpacing: 0.8,
    textTransform: "uppercase",
    marginBottom: 8
  },
  altRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.ruleSoft
  },
  altRowText: {
    flex: 1,
    fontFamily: font.sans,
    fontSize: 14,
    color: colors.ink
  },
  altRowConf: {
    fontFamily: font.mono,
    fontSize: 11,
    color: colors.ink4
  },
  confirmActions: {
    position: "absolute",
    left: 14,
    right: 14,
    flexDirection: "row",
    gap: 8
  },
  actionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 9,
    paddingHorizontal: 14,
    borderRadius: radius.md
  },
  actionBtnGhost: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.rule
  },
  actionBtnPrimary: {
    flex: 1.2,
    backgroundColor: colors.ink
  },
  actionBtnTextGhost: {
    fontFamily: font.sansSemiBold,
    fontSize: 13,
    color: colors.ink
  },
  actionBtnTextPrimary: {
    fontFamily: font.sansSemiBold,
    fontSize: 13,
    color: colors.card
  }
});
