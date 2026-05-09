import { referenceColorFixture, threadTypeFixture } from "../src/data/referenceCatalog.fixture";

describe("reference catalog fixture", () => {
  it("includes both configured thread types", () => {
    const ids = threadTypeFixture.map((threadType) => threadType.id);
    expect(ids).toContain("dmc-six-strand");
    expect(ids).toContain("dmc-pearl-cotton-5");
  });

  it("keeps reference color ids globally unique", () => {
    const ids = referenceColorFixture.map((color) => color.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("allows duplicate color codes across thread types", () => {
    const with310 = referenceColorFixture
      .filter((color) => color.colorCode === "310")
      .map((color) => color.threadTypeId);

    expect(with310).toEqual(expect.arrayContaining(["dmc-six-strand", "dmc-pearl-cotton-5"]));
  });
});
