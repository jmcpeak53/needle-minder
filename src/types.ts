export type ThreadCondition = "full" | "partial";

export type ThreadType = {
  id: string;
  manufacturer: string;
  productLine: string;
  displayName: string;
  isActive: boolean;
};

export type ThreadSubtype = "solid" | "variegated" | "metallic";

export type ReferenceColor = {
  id: string;
  threadTypeId: string;
  colorCode: string;
  colorName: string;
  colorFamily: string;
  hexRgb: string;
  isVariegated: boolean;
  threadSubtype: ThreadSubtype;
  upc?: string | null;
};

export type InventoryItem = {
  id: string;
  referenceColor: ReferenceColor;
  quantity: number;
  condition: ThreadCondition;
  notes?: string | null;
  updatedAt: string;
};

export type OcrCandidate = {
  rawText: string;
  colorCode: string;
  confidence: "high" | "medium" | "low";
};
