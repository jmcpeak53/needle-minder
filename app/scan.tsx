import { CameraView, useCameraPermissions } from "expo-camera";
import { useMemo, useRef, useState } from "react";
import { Pressable, Text, View } from "react-native";

import { useNeedleMinder } from "../src/app/NeedleMinderContext";
import { parseOcrCandidates } from "../src/ocr/ocrParser";
import { MlKitOcrProvider } from "../src/providers/mlKitOcrProvider";
import { ColorSwatch } from "../src/ui/ColorSwatch";
import { PrimaryButton } from "../src/ui/PrimaryButton";
import { Screen } from "../src/ui/Screen";
import { colors, spacing } from "../src/ui/theme";
import type { OcrCandidate, ReferenceColor } from "../src/types";

export default function ScanScreen() {
  const { catalog, addInventory } = useNeedleMinder();
  const cameraRef = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [candidates, setCandidates] = useState<OcrCandidate[]>([]);
  const [rawText, setRawText] = useState<string[]>([]);
  const [selectedCode, setSelectedCode] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const ocrProvider = useMemo(() => new MlKitOcrProvider(), []);

  const selectedColor = catalog.find((color) => color.colorCode === selectedCode) ?? null;

  if (!permission) {
    return (
      <Screen>
        <Text>Checking camera permission...</Text>
      </Screen>
    );
  }

  if (!permission.granted) {
    return (
      <Screen>
        <Text style={{ color: colors.ink, fontSize: 24, fontWeight: "800" }}>Camera access</Text>
        <Text style={{ color: colors.muted, fontSize: 16 }}>
          Needle Minder uses the camera to read the printed DMC number from one skein label at a time.
        </Text>
        <PrimaryButton label="Allow camera" onPress={requestPermission} />
      </Screen>
    );
  }

  return (
    <Screen>
      <Text style={{ color: colors.ink, fontSize: 26, fontWeight: "800" }}>Scan a skein</Text>
      <View style={{ aspectRatio: 3 / 4, borderRadius: 8, overflow: "hidden" }}>
        <CameraView ref={cameraRef} style={{ flex: 1 }} facing="back" barcodeScannerSettings={{ barcodeTypes: ["ean13", "upc_a"] }} />
      </View>
      <PrimaryButton
        label={isScanning ? "Scanning..." : "Capture label"}
        onPress={async () => {
          if (!cameraRef.current || isScanning) {
            return;
          }

          setIsScanning(true);
          const photo = await cameraRef.current.takePictureAsync({ quality: 0.8 });
          const recognizedText = await ocrProvider.recognizeImage(photo.uri);
          const nextCandidates = parseOcrCandidates(recognizedText, catalog);
          setRawText(recognizedText);
          setCandidates(nextCandidates);
          setSelectedCode(nextCandidates[0]?.colorCode ?? null);
          setIsScanning(false);
        }}
      />

      {candidates.length > 0 ? (
        <View style={{ gap: spacing.md }}>
          <Text style={{ color: colors.ink, fontSize: 20, fontWeight: "800" }}>Confirm match</Text>
          {candidates.map((candidate) => {
            const color = catalog.find((entry) => entry.colorCode === candidate.colorCode);
            if (!color) {
              return null;
            }

            return (
              <CandidateRow
                candidate={candidate}
                color={color}
                key={candidate.colorCode}
                selected={candidate.colorCode === selectedCode}
                onPress={() => setSelectedCode(candidate.colorCode)}
              />
            );
          })}
          {selectedColor ? (
            <PrimaryButton
              label={`Save ${selectedColor.colorCode}`}
              onPress={() =>
                addInventory({
                  referenceColorId: selectedColor.id,
                  quantity: 1,
                  condition: "full"
                })
              }
            />
          ) : null}
        </View>
      ) : rawText.length > 0 ? (
        <View style={{ backgroundColor: colors.surface, borderRadius: 8, gap: spacing.sm, padding: spacing.lg }}>
          <Text style={{ color: colors.ink, fontSize: 18, fontWeight: "800" }}>No catalog match found</Text>
          <Text style={{ color: colors.muted }}>
            Use the Add tab to search manually. OCR read: {rawText.join(" / ")}
          </Text>
        </View>
      ) : null}
    </Screen>
  );
}

function CandidateRow({
  candidate,
  color,
  selected,
  onPress
}: {
  candidate: OcrCandidate;
  color: ReferenceColor;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        backgroundColor: selected ? "#F4D9D9" : colors.surface,
        borderColor: selected ? colors.accent : colors.border,
        borderRadius: 8,
        borderWidth: 1,
        flexDirection: "row",
        gap: spacing.md,
        padding: spacing.md
      }}
    >
      <ColorSwatch color={color.hexRgb} />
      <View style={{ flex: 1 }}>
        <Text style={{ color: colors.ink, fontSize: 17, fontWeight: "800" }}>
          {color.colorCode} {color.colorName}
        </Text>
        <Text style={{ color: colors.muted }}>OCR confidence: {candidate.confidence}</Text>
      </View>
    </Pressable>
  );
}
