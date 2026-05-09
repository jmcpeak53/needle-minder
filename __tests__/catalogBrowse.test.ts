import {
  buildCatalogBrowseResults,
  buildReferenceColorSubtitle,
  type CatalogBrowseInput
} from "../src/catalog/catalogBrowse";
import type { ReferenceColor, ThreadType } from "../src/types";

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

const colors: ReferenceColor[] = [
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
    id: "pearl-321",
    threadTypeId: "dmc-pearl-cotton-5",
    colorCode: "321",
    colorName: "Red",
    colorFamily: "Red",
    hexRgb: "#BD1136",
    isVariegated: false,
    threadSubtype: "solid",
    upc: null
  }
];

function buildInput(overrides: Partial<CatalogBrowseInput> = {}): CatalogBrowseInput {
  return {
    catalog: colors,
    filter: "all",
    query: "",
    selectedFamily: null,
    ...overrides
  };
}

describe("catalogBrowse", () => {
  it("filters family browse results by the selected catalog", () => {
    const result = buildCatalogBrowseResults(buildInput({ filter: "dmc-six-strand" }));

    expect(result.families.map((family) => family.name)).toEqual(["Black and Gray"]);
  });

  it("filters search results by the selected catalog", () => {
    const result = buildCatalogBrowseResults(
      buildInput({
        filter: "dmc-pearl-cotton-5",
        query: "310"
      })
    );

    expect(result.results.map((color) => color.id)).toEqual(["pearl-310"]);
  });

  it("shows catalog display names for duplicate codes in all mode", () => {
    expect(
      buildReferenceColorSubtitle(colors[0], {
        filter: "all",
        catalog: colors,
        threadTypes
      })
    ).toBe("Black and Gray · DMC Six-Strand Embroidery Floss");
  });

  it("omits the catalog display name when the current filter already scopes the code", () => {
    expect(
      buildReferenceColorSubtitle(colors[1], {
        filter: "dmc-pearl-cotton-5",
        catalog: colors,
        threadTypes
      })
    ).toBe("Black and White");
  });
});
