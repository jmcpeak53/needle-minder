import { buildVisibleProjectThreadColors } from "../src/projects/projectThreadSelection";
import type { InventoryItem, ReferenceColor } from "../src/types";

const sixBlack: ReferenceColor = {
  id: "dmc-310",
  threadTypeId: "dmc-six-strand",
  colorCode: "310",
  colorName: "Black",
  colorFamily: "Black and Gray",
  hexRgb: "#000000",
  isVariegated: false,
  threadSubtype: "solid",
  upc: null
};

const pearlBlack: ReferenceColor = {
  id: "pearl-310",
  threadTypeId: "dmc-pearl-cotton-5",
  colorCode: "310",
  colorName: "Black",
  colorFamily: "Black and White",
  hexRgb: "#000000",
  isVariegated: false,
  threadSubtype: "solid",
  upc: null
};

const pearlRed: ReferenceColor = {
  id: "pearl-321",
  threadTypeId: "dmc-pearl-cotton-5",
  colorCode: "321",
  colorName: "Red",
  colorFamily: "Red",
  hexRgb: "#BD1136",
  isVariegated: false,
  threadSubtype: "solid",
  upc: null
};

const inventory: InventoryItem[] = [
  {
    id: "inv-1",
    referenceColor: pearlBlack,
    quantity: 1,
    condition: "full",
    favorite: false,
    notes: null,
    updatedAt: "2026-05-09T00:00:00.000Z"
  }
];

describe("buildVisibleProjectThreadColors", () => {
  it("shows stash and reserved colors when no search query is present", () => {
    const visible = buildVisibleProjectThreadColors({
      catalog: [sixBlack, pearlBlack, pearlRed],
      inventory,
      reservedColorIds: new Set(["dmc-310"]),
      query: "",
      filter: "all"
    });

    expect(visible.map((color) => color.id)).toEqual(["dmc-310", "pearl-310"]);
  });

  it("applies the catalog filter before the stash/reserved subset is computed", () => {
    const visible = buildVisibleProjectThreadColors({
      catalog: [sixBlack, pearlBlack, pearlRed],
      inventory,
      reservedColorIds: new Set(["dmc-310"]),
      query: "",
      filter: "dmc-pearl-cotton-5"
    });

    expect(visible.map((color) => color.id)).toEqual(["pearl-310"]);
  });

  it("applies the catalog filter to search results", () => {
    const visible = buildVisibleProjectThreadColors({
      catalog: [sixBlack, pearlBlack, pearlRed],
      inventory,
      reservedColorIds: new Set(),
      query: "321",
      filter: "dmc-pearl-cotton-5"
    });

    expect(visible.map((color) => color.id)).toEqual(["pearl-321"]);
  });
});
