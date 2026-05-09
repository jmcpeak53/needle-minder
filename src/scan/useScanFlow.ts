import { CameraView } from "expo-camera";
import { useEffect, useMemo, useRef, useState } from "react";

import { parseOcrCandidates } from "../ocr/ocrParser";
import { MlKitOcrProvider } from "../providers/mlKitOcrProvider";
import { useCatalog } from "../state/CatalogContext";
import { useInventory } from "../state/InventoryContext";
import type { OcrCandidate, ReferenceColor, ThreadCondition } from "../types";
import { resolveScanCandidate, type ScanCatalogMatch } from "./scanResolution";

export type ConfirmState = {
  candidate: OcrCandidate;
  color: ReferenceColor;
  quantity: number;
  condition: ThreadCondition;
  favorite: boolean;
  notes: string;
  selectionToast: string | null;
};

export type CatalogChoiceState = {
  candidate: OcrCandidate;
  matches: ScanCatalogMatch[];
};

export function useScanFlow() {
  const { catalog, threadTypes, sessionCatalogThreadTypeId, setSessionCatalogThreadTypeId, ready } = useCatalog();
  const { addInventory } = useInventory();

  const cameraRef = useRef<CameraView>(null);
  const [candidates, setCandidates] = useState<OcrCandidate[]>([]);
  const [rawText, setRawText] = useState<string[]>([]);
  const [scanError, setScanError] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [confirming, setConfirming] = useState<ConfirmState | null>(null);
  const [catalogChoice, setCatalogChoice] = useState<CatalogChoiceState | null>(null);
  const [saveForSession, setSaveForSession] = useState(false);
  const [selectionToast, setSelectionToast] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const ocrProvider = useMemo(() => new MlKitOcrProvider(), []);

  useEffect(() => {
    if (!selectionToast) return;
    const timer = setTimeout(() => setSelectionToast(null), 2200);
    return () => clearTimeout(timer);
  }, [selectionToast]);

  function applyCandidate(candidate: OcrCandidate) {
    const resolution = resolveScanCandidate({ candidate, catalog, threadTypes, sessionCatalogThreadTypeId });
    if (!resolution) return;

    if (resolution.mode === "choose-catalog") {
      setCatalogChoice({ candidate: resolution.candidate, matches: resolution.matches });
      setSaveForSession(false);
      return;
    }

    setCatalogChoice(null);
    setConfirming({
      candidate: resolution.candidate,
      color: resolution.color,
      quantity: 1,
      condition: "full",
      favorite: false,
      notes: "",
      selectionToast: resolution.selectionToast
    });
    setSelectionToast(resolution.selectionToast);
  }

  async function capture() {
    if (!cameraRef.current || isScanning) return;
    if (!ready) {
      setScanError("Loading catalog — try again in a moment.");
      return;
    }
    setIsScanning(true);
    setScanError(null);
    setSaved(false);
    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.8 });
      const recognized = await ocrProvider.recognizeImage(photo.uri);
      if (recognized.length === 0) {
        setScanError("No text detected — move closer to the label and try again.");
        return;
      }
      const next = parseOcrCandidates(recognized, catalog);
      setRawText(recognized);
      setCandidates(next);
      if (next.length > 0) applyCandidate(next[0]);
    } catch {
      setScanError("Couldn't read that label. Try again or add manually.");
      setCandidates([]);
      setRawText([]);
    } finally {
      setIsScanning(false);
    }
  }

  async function addToStash() {
    if (!confirming) return;
    await addInventory({
      referenceColorId: confirming.color.id,
      quantity: confirming.quantity,
      condition: confirming.condition,
      favorite: confirming.favorite,
      notes: confirming.notes
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    setConfirming(null);
    setCandidates([]);
    setRawText([]);
  }

  async function chooseCatalogMatch(match: ScanCatalogMatch) {
    if (!catalogChoice) return;
    if (saveForSession) {
      await setSessionCatalogThreadTypeId(match.threadType.id);
    }
    setCatalogChoice(null);
    setConfirming({
      candidate: catalogChoice.candidate,
      color: match.color,
      quantity: 1,
      condition: "full",
      favorite: false,
      notes: "",
      selectionToast: `${match.threadType.displayName} selected`
    });
    setSelectionToast(`${match.threadType.displayName} selected`);
  }

  function reset() {
    setConfirming(null);
    setCatalogChoice(null);
    setCandidates([]);
    setRawText([]);
    setScanError(null);
    setSaved(false);
    setSaveForSession(false);
    setSelectionToast(null);
  }

  return {
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
    applyCandidate,
    capture,
    addToStash,
    chooseCatalogMatch,
    reset,
    catalog,
    threadTypes,
    sessionCatalogThreadTypeId
  };
}
