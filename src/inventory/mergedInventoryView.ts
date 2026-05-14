import type { InventoryItem, ReferenceColor } from "../types";

export type MergedInventoryItem = {
  referenceColorId: string;
  referenceColor: ReferenceColor;
  fullItem: InventoryItem | null;
  partialItem: InventoryItem | null;
  fullQuantity: number;
  partialQuantity: number;
  totalQuantity: number;
  favorite: boolean;
  notes: string | null;
  updatedAt: string;
};

export function mergeInventory(items: InventoryItem[]): MergedInventoryItem[] {
  const grouped = new Map<string, MergedInventoryItem>();

  for (const item of items) {
    const key = item.referenceColor.id;
    const existing = grouped.get(key);

    if (!existing) {
      grouped.set(key, buildMergedFromSingle(item));
      continue;
    }

    grouped.set(key, mergeInto(existing, item));
  }

  return Array.from(grouped.values());
}

export function findMerged(
  items: InventoryItem[],
  referenceColorId: string
): MergedInventoryItem | null {
  let merged: MergedInventoryItem | null = null;

  for (const item of items) {
    if (item.referenceColor.id !== referenceColorId) continue;
    merged = merged ? mergeInto(merged, item) : buildMergedFromSingle(item);
  }

  return merged;
}

function buildMergedFromSingle(item: InventoryItem): MergedInventoryItem {
  const isFull = item.condition === "full";
  return {
    referenceColorId: item.referenceColor.id,
    referenceColor: item.referenceColor,
    fullItem: isFull ? item : null,
    partialItem: isFull ? null : item,
    fullQuantity: isFull ? item.quantity : 0,
    partialQuantity: isFull ? 0 : item.quantity,
    totalQuantity: item.quantity,
    favorite: item.favorite,
    notes: item.notes ?? null,
    updatedAt: item.updatedAt
  };
}

function mergeInto(merged: MergedInventoryItem, item: InventoryItem): MergedInventoryItem {
  const isFull = item.condition === "full";
  const fullItem = isFull ? item : merged.fullItem;
  const partialItem = isFull ? merged.partialItem : item;
  const fullQuantity = fullItem?.quantity ?? 0;
  const partialQuantity = partialItem?.quantity ?? 0;

  return {
    referenceColorId: merged.referenceColorId,
    referenceColor: fullItem?.referenceColor ?? partialItem?.referenceColor ?? merged.referenceColor,
    fullItem,
    partialItem,
    fullQuantity,
    partialQuantity,
    totalQuantity: fullQuantity + partialQuantity,
    favorite: (fullItem?.favorite ?? false) || (partialItem?.favorite ?? false),
    notes: (fullItem?.notes ?? null) ?? (partialItem?.notes ?? null),
    updatedAt: pickLatestTimestamp(fullItem?.updatedAt, partialItem?.updatedAt)
  };
}

function pickLatestTimestamp(a: string | undefined, b: string | undefined): string {
  if (!a) return b ?? "";
  if (!b) return a;
  return a >= b ? a : b;
}
