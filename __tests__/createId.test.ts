import { createId } from "../src/db/createId";

describe("createId", () => {
  it("returns a string", () => {
    expect(typeof createId()).toBe("string");
  });

  it("returns a string with a hyphen separating a timestamp and a random part", () => {
    const id = createId();
    const parts = id.split("-");
    expect(parts).toHaveLength(2);

    const [timestamp, randomPart] = parts;

    // Timestamp part should be a valid number
    expect(Number.isNaN(Number(timestamp))).toBe(false);
    expect(timestamp.length).toBeGreaterThan(10); // Typical current timestamp length

    // Random part should be a string of alphanumeric characters
    // Math.random().toString(36).slice(2, 10) can be up to 8 characters
    expect(randomPart.length).toBeLessThanOrEqual(8);
    expect(randomPart).toMatch(/^[a-z0-9]*$/);
  });

  it("generates unique IDs in rapid succession", () => {
    const ids = new Set<string>();
    const count = 100;
    for (let i = 0; i < count; i++) {
      ids.add(createId());
    }
    expect(ids.size).toBe(count);
  });

  it("uses a timestamp close to the current time", () => {
    const before = Date.now();
    const id = createId();
    const after = Date.now();
    const timestamp = parseInt(id.split("-")[0], 10);

    expect(timestamp).toBeGreaterThanOrEqual(before);
    expect(timestamp).toBeLessThanOrEqual(after);
  });
});
