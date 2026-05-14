import { findMerged, mergeInventory } from "../src/inventory/mergedInventoryView";
import type { InventoryItem, ReferenceColor, ThreadCondition } from "../src/types";

function color(id: string, code: string): ReferenceColor {
  return {
    id,
    threadTypeId: "dmc-six-strand",
    colorCode: code,
    colorName: code,
    colorFamily: "Greens",
    hexRgb: "#7a8b3c",
    isVariegated: false,
    threadSubtype: "solid",
    upc: null
  };
}

function item(
  id: string,
  refColor: ReferenceColor,
  quantity: number,
  condition: ThreadCondition,
  overrides: Partial<InventoryItem> = {}
): InventoryItem {
  return {
    id,
    referenceColor: refColor,
    quantity,
    condition,
    favorite: false,
    notes: null,
    updatedAt: "2026-01-01T00:00:00.000Z",
    ...overrides
  };
}

describe("mergeInventory", () => {
  it("collapses full + partial rows for the same color into one merged item", () => {
    const c = color("color-1", "367");
    const items = [
      item("inv-full", c, 3, "full"),
      item("inv-partial", c, 2, "partial")
    ];

    const merged = mergeInventory(items);

    expect(merged).toHaveLength(1);
    expect(merged[0]).toMatchObject({
      referenceColorId: "color-1",
      fullQuantity: 3,
      partialQuantity: 2,
      totalQuantity: 5
    });
    expect(merged[0].fullItem?.id).toBe("inv-full");
    expect(merged[0].partialItem?.id).toBe("inv-partial");
  });

  it("returns a single item when only full exists", () => {
    const c = color("color-1", "367");
    const merged = mergeInventory([item("inv-1", c, 4, "full")]);

    expect(merged).toHaveLength(1);
    expect(merged[0].fullQuantity).toBe(4);
    expect(merged[0].partialQuantity).toBe(0);
    expect(merged[0].partialItem).toBeNull();
    expect(merged[0].totalQuantity).toBe(4);
  });

  it("returns a single item when only partial exists", () => {
    const c = color("color-1", "367");
    const merged = mergeInventory([item("inv-1", c, 1, "partial")]);

    expect(merged).toHaveLength(1);
    expect(merged[0].fullQuantity).toBe(0);
    expect(merged[0].partialQuantity).toBe(1);
    expect(merged[0].fullItem).toBeNull();
  });

  it("OR's favorite across the pair", () => {
    const c = color("color-1", "367");
    const merged = mergeInventory([
      item("inv-full", c, 1, "full", { favorite: false }),
      item("inv-partial", c, 1, "partial", { favorite: true })
    ]);

    expect(merged[0].favorite).toBe(true);
  });

  it("prefers the full row's notes when both have notes", () => {
    const c = color("color-1", "367");
    const merged = mergeInventory([
      item("inv-full", c, 1, "full", { notes: "full note" }),
      item("inv-partial", c, 1, "partial", { notes: "partial note" })
    ]);

    expect(merged[0].notes).toBe("full note");
  });

  it("falls back to partial notes when full has none", () => {
    const c = color("color-1", "367");
    const merged = mergeInventory([
      item("inv-full", c, 1, "full", { notes: null }),
      item("inv-partial", c, 1, "partial", { notes: "partial note" })
    ]);

    expect(merged[0].notes).toBe("partial note");
  });

  it("groups multiple colors independently", () => {
    const c1 = color("color-1", "367");
    const c2 = color("color-2", "310");
    const merged = mergeInventory([
      item("inv-1", c1, 2, "full"),
      item("inv-2", c2, 1, "full"),
      item("inv-3", c1, 1, "partial")
    ]);

    expect(merged).toHaveLength(2);
    const m1 = merged.find((m) => m.referenceColorId === "color-1");
    const m2 = merged.find((m) => m.referenceColorId === "color-2");
    expect(m1?.totalQuantity).toBe(3);
    expect(m2?.totalQuantity).toBe(1);
  });

  it("picks the most recent updatedAt timestamp", () => {
    const c = color("color-1", "367");
    const merged = mergeInventory([
      item("inv-full", c, 1, "full", { updatedAt: "2026-01-01T00:00:00.000Z" }),
      item("inv-partial", c, 1, "partial", { updatedAt: "2026-03-01T00:00:00.000Z" })
    ]);

    expect(merged[0].updatedAt).toBe("2026-03-01T00:00:00.000Z");
  });
});

describe("findMerged", () => {
  it("returns the merged item for the given referenceColorId", () => {
    const c1 = color("color-1", "367");
    const c2 = color("color-2", "310");
    const items = [
      item("inv-1", c1, 2, "full"),
      item("inv-2", c2, 1, "full"),
      item("inv-3", c1, 1, "partial")
    ];

    const found = findMerged(items, "color-1");
    expect(found).not.toBeNull();
    expect(found?.totalQuantity).toBe(3);
    expect(found?.fullQuantity).toBe(2);
    expect(found?.partialQuantity).toBe(1);
  });

  it("returns null when no rows exist for the referenceColorId", () => {
    const c1 = color("color-1", "367");
    const found = findMerged([item("inv-1", c1, 2, "full")], "missing");
    expect(found).toBeNull();
  });
});
