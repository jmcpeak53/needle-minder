import { resolveScanCandidate } from "../src/scan/scanResolution";
import type { OcrCandidate, ReferenceColor, ThreadType } from "../src/types";

const threadTypes: ThreadType[] = [
  {
    id: "dmc-six-strand",
    manufacturer: "DMC",
    productLine: "Six-Strand Embroidery Floss",
    displayName: "DMC Six-Strand Embroidery Floss",
    isActive: true
  },
  {
    id: "dmc-pearl-cotton-5",
    manufacturer: "DMC",
    productLine: "Pearl Cotton Size 5",
    displayName: "DMC Pearl Cotton Size 5",
    isActive: true
  }
];

const catalog: ReferenceColor[] = [
  {
    id: "dmc-310",
    threadTypeId: "dmc-six-strand",
    colorCode: "310",
    colorName: "Black",
    colorFamily: "Black and Gray",
    hexRgb: "#000000",
    isVariegated: false,
    threadSubtype: "solid",
    upc: null
  },
  {
    id: "pearl-310",
    threadTypeId: "dmc-pearl-cotton-5",
    colorCode: "310",
    colorName: "Black",
    colorFamily: "Black and White",
    hexRgb: "#000000",
    isVariegated: false,
    threadSubtype: "solid",
    upc: null
  },
  {
    id: "dmc-321",
    threadTypeId: "dmc-six-strand",
    colorCode: "321",
    colorName: "Red",
    colorFamily: "Red",
    hexRgb: "#BD1136",
    isVariegated: false,
    threadSubtype: "solid",
    upc: null
  }
];

const duplicateCandidate: OcrCandidate = {
  rawText: "DMC310",
  colorCode: "310",
  confidence: "high"
};

describe("resolveScanCandidate", () => {
  it("returns direct confirmation when the code has a single catalog match", () => {
    const resolution = resolveScanCandidate({
      candidate: {
        rawText: "DMC321",
        colorCode: "321",
        confidence: "high"
      },
      catalog,
      threadTypes,
      sessionCatalogThreadTypeId: null
    });

    if (!resolution) {
      throw new Error("expected a resolution");
    }
    expect(resolution.mode).toBe("confirm");
    if (resolution.mode !== "confirm") {
      throw new Error("expected confirm resolution");
    }
    expect(resolution.color.id).toBe("dmc-321");
    expect(resolution.selectionToast).toBeNull();
  });

  it("returns a catalog choice list when duplicate matches exist and no session catalog is saved", () => {
    const resolution = resolveScanCandidate({
      candidate: duplicateCandidate,
      catalog,
      threadTypes,
      sessionCatalogThreadTypeId: null
    });

    if (!resolution) {
      throw new Error("expected a resolution");
    }
    expect(resolution.mode).toBe("choose-catalog");
    if (resolution.mode !== "choose-catalog") {
      throw new Error("expected choose-catalog resolution");
    }
    expect(resolution.matches.map((match: { threadType: ThreadType }) => match.threadType.displayName)).toEqual([
      "DMC Six-Strand Embroidery Floss",
      "DMC Pearl Cotton Size 5"
    ]);
  });

  it("auto-selects the saved session catalog and returns a toast message", () => {
    const resolution = resolveScanCandidate({
      candidate: duplicateCandidate,
      catalog,
      threadTypes,
      sessionCatalogThreadTypeId: "dmc-pearl-cotton-5"
    });

    if (!resolution) {
      throw new Error("expected a resolution");
    }
    expect(resolution.mode).toBe("confirm");
    if (resolution.mode !== "confirm") {
      throw new Error("expected confirm resolution");
    }
    expect(resolution.color.id).toBe("pearl-310");
    expect(resolution.selectionToast).toBe("DMC Pearl Cotton Size 5 selected");
  });
});
