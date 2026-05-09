import { applyCatalogFilter, buildCatalogFilterOptions, formatCatalogFilterLabel, type CatalogFilter } from "../src/catalog/catalogFilter";
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
  }
];

describe("catalogFilter", () => {
  it("returns all colors when the filter is all", () => {
    expect(applyCatalogFilter(colors, "all")).toEqual(colors);
  });

  it("returns only matching thread types for a catalog-specific filter", () => {
    expect(applyCatalogFilter(colors, "dmc-pearl-cotton-5")).toEqual([colors[1]]);
  });

  it("builds all-first filter options from thread type display names", () => {
    expect(buildCatalogFilterOptions(threadTypes)).toEqual([
      {
        value: "all",
        label: "All catalogs"
      },
      {
        value: "dmc-six-strand",
        label: "DMC Six-Strand Embroidery Floss",
        manufacturer: "DMC",
        productLine: "Six-Strand Embroidery Floss"
      },
      {
        value: "dmc-pearl-cotton-5",
        label: "DMC Pearl Cotton Size 5",
        manufacturer: "DMC",
        productLine: "Pearl Cotton Size 5"
      }
    ]);
  });

  it("formats the active filter label from thread type metadata", () => {
    expect(formatCatalogFilterLabel("all", threadTypes)).toBe("All catalogs");
    expect(formatCatalogFilterLabel("dmc-pearl-cotton-5", threadTypes)).toBe("DMC Pearl Cotton Size 5");
  });

  it("falls back to all when a saved filter does not exist in the live catalog list", () => {
    const staleFilter = "missing-type" as CatalogFilter;

    expect(formatCatalogFilterLabel(staleFilter, threadTypes)).toBe("All catalogs");
  });
});
