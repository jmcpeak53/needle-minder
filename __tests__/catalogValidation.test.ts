import { validateReferenceColors } from "../src/catalog/catalogValidation";

const validRows = [
  {
    colorCode: "310",
    colorName: "Black",
    colorFamily: "Black and Gray",
    hexRgb: "#000000",
    isVariegated: "false"
  },
  {
    colorCode: "115",
    colorName: "Garnet",
    colorFamily: "Red",
    hexRgb: "#8F011B",
    isVariegated: "true"
  }
];

describe("validateReferenceColors", () => {
  it("accepts complete DMC color rows and normalizes values", () => {
    const result = validateReferenceColors(validRows);

    expect(result.ok).toBe(true);
    expect(result.colors).toEqual([
      {
        colorCode: "310",
        colorName: "Black",
        colorFamily: "Black and Gray",
        hexRgb: "#000000",
        isVariegated: false,
        threadSubtype: "solid"
      },
      {
        colorCode: "115",
        colorName: "Garnet",
        colorFamily: "Red",
        hexRgb: "#8F011B",
        isVariegated: true,
        threadSubtype: "solid"
      }
    ]);
  });

  it("rejects duplicate color codes", () => {
    const result = validateReferenceColors([validRows[0], validRows[0]]);

    expect(result.ok).toBe(false);
    expect(result.errors).toContain("Row 2: duplicate color code 310.");
  });

  it("rejects missing names and invalid hex colors", () => {
    const result = validateReferenceColors([
      {
        colorCode: "321",
        colorName: "",
        colorFamily: "Red",
        hexRgb: "red",
        isVariegated: "false"
      }
    ]);

    expect(result.ok).toBe(false);
    expect(result.errors).toEqual([
      "Row 1: colorName is required.",
      "Row 1: hexRgb must be a 6-digit hex color like #C72B3B."
    ]);
  });
});
