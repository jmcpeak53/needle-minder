import { seedReferenceData } from "../src/db/database";

describe("seedReferenceData", () => {
  it("upserts thread types instead of ignoring conflicts", async () => {
    const runAsync = jest.fn<Promise<void>, [string, unknown[]?]>(
      async (_sql: string, _params?: unknown[]) => undefined
    );
    const database = { runAsync } as never;

    await seedReferenceData(database);

    const firstCall = runAsync.mock.calls[0];
    const threadTypeSql = firstCall[0];
    expect(threadTypeSql).toContain("INSERT INTO thread_types");
    expect(threadTypeSql).toContain("ON CONFLICT(id) DO UPDATE SET");
    expect(threadTypeSql).toContain("display_name = excluded.display_name");
    expect(threadTypeSql).not.toContain("INSERT OR IGNORE INTO thread_types");
  });

  it("upserts reference color metadata without updating the primary key id", async () => {
    const runAsync = jest.fn<Promise<void>, [string, unknown[]?]>(
      async (_sql: string, _params?: unknown[]) => undefined
    );
    const database = { runAsync } as never;

    await seedReferenceData(database);

    const referenceColorCall = runAsync.mock.calls.find((call) =>
      String(call[0]).includes("INSERT INTO reference_colors")
    );
    expect(referenceColorCall).toBeDefined();
    const referenceColorSql = referenceColorCall![0];

    expect(referenceColorSql).toContain("ON CONFLICT(thread_type_id, color_code) DO UPDATE SET");
    expect(referenceColorSql).toContain("color_name = excluded.color_name");
    expect(referenceColorSql).toContain("upc = excluded.upc");
    expect(referenceColorSql).not.toContain("id = excluded.id");
    expect(referenceColorSql).not.toContain("created_at = excluded.created_at");
    expect(referenceColorSql).not.toContain("INSERT OR IGNORE INTO reference_colors");
  });
});
