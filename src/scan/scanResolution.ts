import type { OcrCandidate, ReferenceColor, ThreadType } from "../types";

export type ScanCatalogMatch = {
  color: ReferenceColor;
  threadType: ThreadType;
};

export type ScanResolution =
  | {
      mode: "confirm";
      candidate: OcrCandidate;
      color: ReferenceColor;
      selectionToast: string | null;
    }
  | {
      mode: "choose-catalog";
      candidate: OcrCandidate;
      matches: ScanCatalogMatch[];
    };

export function resolveScanCandidate(input: {
  candidate: OcrCandidate;
  catalog: ReferenceColor[];
  threadTypes: ThreadType[];
  sessionCatalogThreadTypeId: string | null;
}): ScanResolution | null {
  const matches = input.catalog
    .filter((color) => color.colorCode === input.candidate.colorCode)
    .map((color) => {
      const threadType = input.threadTypes.find((item) => item.id === color.threadTypeId);
      if (!threadType) {
        return null;
      }

      return { color, threadType };
    })
    .filter((match): match is ScanCatalogMatch => match !== null);

  if (matches.length === 0) {
    return null;
  }

  if (matches.length === 1) {
    return {
      mode: "confirm",
      candidate: input.candidate,
      color: matches[0].color,
      selectionToast: null
    };
  }

  const sessionMatch = input.sessionCatalogThreadTypeId
    ? matches.find((match) => match.threadType.id === input.sessionCatalogThreadTypeId)
    : null;

  if (sessionMatch) {
    return {
      mode: "confirm",
      candidate: input.candidate,
      color: sessionMatch.color,
      selectionToast: `${sessionMatch.threadType.displayName} selected`
    };
  }

  return {
    mode: "choose-catalog",
    candidate: input.candidate,
    matches
  };
}
