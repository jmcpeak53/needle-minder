import type { OcrCandidate, ReferenceColor } from "../types";

const tokenPattern = /\b(?:[A-Z]{1,2}\s*)?\d{1,4}\b/g;
const ignoredCommonLabelNumbers = new Set(["8", "25", "100", "117"]);

export function parseOcrCandidates(rawTextLines: string[], catalog: ReferenceColor[]): OcrCandidate[] {
  const validCodes = new Set(catalog.map((color) => color.colorCode.toUpperCase()));
  const seen = new Set<string>();
  const candidates: OcrCandidate[] = [];

  rawTextLines.forEach((rawText) => {
    const normalized = rawText.toUpperCase().replace(/([A-Z])(\d)/g, "$1 $2");
    const matches = normalized.match(tokenPattern) ?? [];

    matches.forEach((match) => {
      const colorCode = match.replace(/\s+/g, "");

      if (seen.has(colorCode) || ignoredCommonLabelNumbers.has(colorCode)) {
        return;
      }

      if (!validCodes.has(colorCode)) {
        return;
      }

      seen.add(colorCode);
      candidates.push({
        rawText,
        colorCode,
        confidence: normalized.includes("DMC") ? "high" : "medium"
      });
    });
  });

  return candidates.sort((left, right) => confidenceScore(right.confidence) - confidenceScore(left.confidence));
}

function confidenceScore(confidence: OcrCandidate["confidence"]): number {
  if (confidence === "high") {
    return 3;
  }

  if (confidence === "medium") {
    return 2;
  }

  return 1;
}
