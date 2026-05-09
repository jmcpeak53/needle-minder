import { SqlitePreferencesRepository } from "../src/db/sqlitePreferencesRepository";

function createDatabase() {
  const values = new Map<string, string>();

  return {
    values,
    getFirstAsync: jest.fn(async (_sql: string, params?: unknown[]) => {
      const key = String(params?.[0] ?? "");
      const value = values.get(key);
      return value === undefined ? null : { value };
    }),
    runAsync: jest.fn(async (_sql: string, params?: unknown[]) => {
      const key = String(params?.[0] ?? "");
      if (_sql.startsWith("DELETE FROM app_preferences")) {
        values.delete(key);
        return;
      }

      const value = params?.[1];

      if (value === null) {
        values.delete(key);
        return;
      }

      values.set(key, String(value));
    })
  };
}

describe("SqlitePreferencesRepository", () => {
  it("defaults the catalog filter to all when unset", async () => {
    const database = createDatabase();
    const repository = new SqlitePreferencesRepository(database as never);

    await expect(repository.getDefaultCatalogFilter()).resolves.toBe("all");
  });

  it("round-trips a saved default catalog filter", async () => {
    const database = createDatabase();
    const repository = new SqlitePreferencesRepository(database as never);

    await repository.setDefaultCatalogFilter("dmc-pearl-cotton-5");

    await expect(repository.getDefaultCatalogFilter()).resolves.toBe("dmc-pearl-cotton-5");
  });

  it("stores and clears the scan session catalog", async () => {
    const database = createDatabase();
    const repository = new SqlitePreferencesRepository(database as never);

    await repository.setSessionCatalogThreadTypeId("dmc-pearl-cotton-5");
    await expect(repository.getSessionCatalogThreadTypeId()).resolves.toBe("dmc-pearl-cotton-5");

    await repository.clearSessionCatalogThreadTypeId();
    await expect(repository.getSessionCatalogThreadTypeId()).resolves.toBeNull();
  });
});
