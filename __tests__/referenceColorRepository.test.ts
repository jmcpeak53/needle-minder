import { InMemoryReferenceColorRepository } from "../src/catalog/inMemoryReferenceColorRepository";
import type { ReferenceColor } from "../src/types";

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

describe("InMemoryReferenceColorRepository.findByCode", () => {
  it("returns the unique match when a code exists in only one catalog", async () => {
    const repository = new InMemoryReferenceColorRepository(colors);

    await expect(repository.findByCode("321")).resolves.toMatchObject({ id: "dmc-321" });
  });

  it("returns null when the code is ambiguous across catalogs", async () => {
    const repository = new InMemoryReferenceColorRepository(colors);

    await expect(repository.findByCode("310")).resolves.toBeNull();
  });
});
