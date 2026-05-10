import {
  BackupValidationError,
  buildEnvelope,
  parseEnvelope,
  restoreEnvelope,
  serializeEnvelope
} from "../src/backup/envelope";
import { SCHEMA_VERSION } from "../src/db/database";
import type {
  AppPreferenceRow,
  BackupData,
  ProjectRow,
  ProjectThreadReservationRow,
  UserInventoryRow
} from "../src/backup/types";

const inventoryRow: UserInventoryRow = {
  id: "inv-1",
  reference_color_id: "dmc-six-strand-color-310",
  quantity: 2,
  condition: "full",
  is_favorite: 0,
  notes: null,
  created_at: "2026-05-01T00:00:00.000Z",
  updated_at: "2026-05-01T00:00:00.000Z"
};

const projectRow: ProjectRow = {
  id: "proj-1",
  folder: "Holiday",
  name: "Winter Sampler",
  author: null,
  canvas_mesh: null,
  status: "wip",
  start_date: "2026-05-01",
  completed_date: null,
  image_uri: null,
  notes: null,
  created_at: "2026-05-01T00:00:00.000Z",
  updated_at: "2026-05-01T00:00:00.000Z"
};

const reservationRow: ProjectThreadReservationRow = {
  id: "res-1",
  project_id: "proj-1",
  reference_color_id: "dmc-six-strand-color-310",
  quantity: 1,
  created_at: "2026-05-01T00:00:00.000Z",
  updated_at: "2026-05-01T00:00:00.000Z"
};

const prefRow: AppPreferenceRow = {
  key: "default_catalog_filter",
  value: "all",
  updated_at: "2026-05-01T00:00:00.000Z"
};

const sampleData: BackupData = {
  user_inventory: [inventoryRow],
  projects: [projectRow],
  project_thread_reservations: [reservationRow],
  app_preferences: [prefRow]
};

describe("buildEnvelope + serializeEnvelope + parseEnvelope (round-trip)", () => {
  it("serializes and deserializes all rows without data loss", () => {
    const envelope = buildEnvelope(sampleData, "0.1.0");
    const json = serializeEnvelope(envelope);
    const parsed = parseEnvelope(json);

    expect(parsed.format).toBe("needle-minder-backup");
    expect(parsed.schemaVersion).toBe(SCHEMA_VERSION);
    expect(parsed.appVersion).toBe("0.1.0");
    expect(parsed.data.user_inventory).toHaveLength(1);
    expect(parsed.data.user_inventory[0]).toEqual(inventoryRow);
    expect(parsed.data.projects).toHaveLength(1);
    expect(parsed.data.projects[0]).toEqual(projectRow);
    expect(parsed.data.project_thread_reservations).toHaveLength(1);
    expect(parsed.data.project_thread_reservations[0]).toEqual(reservationRow);
    expect(parsed.data.app_preferences).toHaveLength(1);
    expect(parsed.data.app_preferences[0]).toEqual(prefRow);
  });
});

describe("parseEnvelope validation", () => {
  it("rejects non-JSON input", () => {
    expect(() => parseEnvelope("not json")).toThrow(BackupValidationError);
  });

  it("rejects JSON that is not a Needle Minder backup", () => {
    expect(() => parseEnvelope('{"format":"something-else"}')).toThrow(BackupValidationError);
  });

  it("rejects a backup with a newer schemaVersion", () => {
    const envelope = buildEnvelope(sampleData, "0.1.0");
    const tampered = { ...envelope, schemaVersion: SCHEMA_VERSION + 1 };
    expect(() => parseEnvelope(JSON.stringify(tampered))).toThrow(BackupValidationError);
  });

  it("rejects a backup with a newer envelopeVersion", () => {
    const envelope = buildEnvelope(sampleData, "0.1.0");
    const tampered = { ...envelope, envelopeVersion: 999 };
    expect(() => parseEnvelope(JSON.stringify(tampered))).toThrow(BackupValidationError);
  });

  it("rejects a backup missing a data table", () => {
    const envelope = buildEnvelope(sampleData, "0.1.0");
    const tampered = { ...envelope, data: { ...envelope.data, user_inventory: undefined } };
    expect(() => parseEnvelope(JSON.stringify(tampered))).toThrow(BackupValidationError);
  });
});

describe("restoreEnvelope", () => {
  function buildDatabase(
    referencedColorIds: string[] = ["dmc-six-strand-color-310"]
  ) {
    const execCalls: string[] = [];
    const runCalls: { sql: string; params: unknown[] }[] = [];

    const database = {
      getAllAsync: jest.fn(async (sql: string, params?: unknown[]) => {
        if (sql.includes("reference_colors")) {
          const ids = (params ?? []) as string[];
          return ids
            .filter((id) => referencedColorIds.includes(id))
            .map((id) => ({ id }));
        }
        return [];
      }),
      execAsync: jest.fn(async (sql: string) => {
        execCalls.push(sql.trim());
      }),
      runAsync: jest.fn(async (sql: string, params?: unknown[]) => {
        runCalls.push({ sql: sql.trim(), params: params ?? [] });
      }),
      _execCalls: execCalls,
      _runCalls: runCalls
    };

    return database;
  }

  it("restores all rows and returns correct inserted counts", async () => {
    const database = buildDatabase();
    const envelope = buildEnvelope(sampleData, "0.1.0");
    const result = await restoreEnvelope(database as never, envelope);

    expect(result.inserted.user_inventory).toBe(1);
    expect(result.inserted.projects).toBe(1);
    expect(result.inserted.project_thread_reservations).toBe(1);
    expect(result.inserted.app_preferences).toBe(1);
  });

  it("deletes tables in dependency order before inserting", async () => {
    const database = buildDatabase();
    const envelope = buildEnvelope(sampleData, "0.1.0");
    await restoreEnvelope(database as never, envelope);

    const deleteStatements = database._execCalls.filter((s) => s.startsWith("DELETE"));
    expect(deleteStatements[0]).toContain("project_thread_reservations");
    expect(deleteStatements[1]).toContain("projects");
    expect(deleteStatements[2]).toContain("user_inventory");
    expect(deleteStatements[3]).toContain("app_preferences");
  });

  it("wraps the restore in a transaction", async () => {
    const database = buildDatabase();
    const envelope = buildEnvelope(sampleData, "0.1.0");
    await restoreEnvelope(database as never, envelope);

    expect(database._execCalls[0]).toContain("BEGIN");
    expect(database._execCalls[database._execCalls.length - 1]).toContain("COMMIT");
  });

  it("rolls back and rethrows when an insert fails", async () => {
    const database = buildDatabase();
    let runCallCount = 0;
    database.runAsync = jest.fn(async (_sql: string, _params?: unknown[]) => {
      if (++runCallCount === 2) throw new Error("disk full");
    });

    await expect(
      restoreEnvelope(database as never, buildEnvelope(sampleData, "0.1.0"))
    ).rejects.toThrow("disk full");

    expect(database._execCalls).toContain("ROLLBACK");
  });

  it("aborts with BackupValidationError when a referenceColorId is missing from the catalog", async () => {
    const database = buildDatabase([]);
    const envelope = buildEnvelope(sampleData, "0.1.0");

    await expect(restoreEnvelope(database as never, envelope)).rejects.toThrow(
      BackupValidationError
    );
    const noDeletes = database._execCalls.filter((s) => s.startsWith("DELETE"));
    expect(noDeletes).toHaveLength(0);
  });

  it("returns a photo warning when restored projects have image URIs", async () => {
    const dataWithPhoto: BackupData = {
      ...sampleData,
      projects: [{ ...projectRow, image_uri: "file:///cache/photo.jpg" }]
    };
    const database = buildDatabase();
    const result = await restoreEnvelope(
      database as never,
      buildEnvelope(dataWithPhoto, "0.1.0")
    );

    expect(result.warnings).toHaveLength(1);
    expect(result.warnings[0]).toContain("photo");
  });

  it("returns no photo warning when no projects have image URIs", async () => {
    const database = buildDatabase();
    const result = await restoreEnvelope(
      database as never,
      buildEnvelope(sampleData, "0.1.0")
    );

    expect(result.warnings).toHaveLength(0);
  });
});
