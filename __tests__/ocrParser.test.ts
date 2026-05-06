import { parseOcrCandidates } from "../src/ocr/ocrParser";
import type { ReferenceColor } from "../src/types";

const catalog: ReferenceColor[] = [
  {
    id: "color-310",
    threadTypeId: "dmc-six-strand",
    colorCode: "310",
    colorName: "Black",
    colorFamily: "Black and Gray",
    hexRgb: "#000000",
    isVariegated: false,
    upc: null
  },
  {
    id: "color-321",
    threadTypeId: "dmc-six-strand",
    colorCode: "321",
    colorName: "Red",
    colorFamily: "Red",
    hexRgb: "#C72B3B",
    isVariegated: false,
    upc: "077540051106"
  },
  {
    id: "color-b5200",
    threadTypeId: "dmc-six-strand",
    colorCode: "B5200",
    colorName: "Snow White",
    colorFamily: "White",
    hexRgb: "#FFFFFF",
    isVariegated: false,
    upc: null
  }
];

describe("parseOcrCandidates", () => {
  it("returns exact catalog color codes from noisy label text", () => {
    const candidates = parseOcrCandidates(["DMC 25 321", "8m 100% cotton"], catalog);

    expect(candidates).toEqual([
      {
        rawText: "DMC 25 321",
        colorCode: "321",
        confidence: "high"
      }
    ]);
  });

  it("supports letter-prefixed DMC codes such as B5200", () => {
    const candidates = parseOcrCandidates(["DMC B5200 blanc neige"], catalog);

    expect(candidates[0]).toMatchObject({
      colorCode: "B5200",
      confidence: "high"
    });
  });

  it("ignores numbers that are not known catalog color codes", () => {
    const candidates = parseOcrCandidates(["117 8m 100% 25"], catalog);

    expect(candidates).toEqual([]);
  });

  it("does not treat a UPC barcode value as an OCR color-code match", () => {
    const candidates = parseOcrCandidates(["077540051106"], catalog);

    expect(candidates).toEqual([]);
  });
});
