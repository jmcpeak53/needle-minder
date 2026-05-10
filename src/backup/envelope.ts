import { SCHEMA_VERSION } from "../db/database";
import type { NeedleMinderDatabase } from "../db/database";
import {
  AppPreferenceRow,
  BACKUP_FORMAT,
  BackupData,
  BackupEnvelope,
  ENVELOPE_VERSION,
  ProjectRow,
  ProjectThreadReservationRow,
  RestoreResult,
  UserInventoryRow
} from "./types";

export class BackupValidationError extends Error {}

export async function collectBackupData(database: NeedleMinderDatabase): Promise<BackupData> {
  const [userInventory, projects, reservations, preferences] = await Promise.all([
    database.getAllAsync<UserInventoryRow>("SELECT * FROM user_inventory ORDER BY created_at ASC"),
    database.getAllAsync<ProjectRow>("SELECT * FROM projects ORDER BY created_at ASC"),
    database.getAllAsync<ProjectThreadReservationRow>(
      "SELECT * FROM project_thread_reservations ORDER BY created_at ASC"
    ),
    database.getAllAsync<AppPreferenceRow>("SELECT * FROM app_preferences ORDER BY key ASC")
  ]);

  return {
    user_inventory: userInventory,
    projects,
    project_thread_reservations: reservations,
    app_preferences: preferences
  };
}

export function buildEnvelope(data: BackupData, appVersion: string): BackupEnvelope {
  return {
    format: BACKUP_FORMAT,
    envelopeVersion: ENVELOPE_VERSION,
    schemaVersion: SCHEMA_VERSION,
    exportedAt: new Date().toISOString(),
    appVersion,
    data
  };
}

export function serializeEnvelope(envelope: BackupEnvelope): string {
  return JSON.stringify(envelope, null, 2);
}

export function parseEnvelope(raw: string): BackupEnvelope {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new BackupValidationError("File is not valid JSON.");
  }

  if (!parsed || typeof parsed !== "object") {
    throw new BackupValidationError("File does not contain a backup object.");
  }

  const envelope = parsed as Partial<BackupEnvelope>;

  if (envelope.format !== BACKUP_FORMAT) {
    throw new BackupValidationError("File is not a Needle Minder backup.");
  }
  if (typeof envelope.envelopeVersion !== "number" || envelope.envelopeVersion > ENVELOPE_VERSION) {
    throw new BackupValidationError(
      "Backup envelope is from a newer app version. Please update Needle Minder."
    );
  }
  if (typeof envelope.schemaVersion !== "number") {
    throw new BackupValidationError("Backup is missing a schema version.");
  }
  if (envelope.schemaVersion > SCHEMA_VERSION) {
    throw new BackupValidationError(
      "Backup is from a newer schema version. Please update Needle Minder."
    );
  }
  if (!envelope.data || typeof envelope.data !== "object") {
    throw new BackupValidationError("Backup is missing its data section.");
  }

  const data = envelope.data as Partial<BackupData>;
  for (const key of [
    "user_inventory",
    "projects",
    "project_thread_reservations",
    "app_preferences"
  ] as const) {
    if (!Array.isArray(data[key])) {
      throw new BackupValidationError(`Backup is missing the '${key}' table.`);
    }
  }

  return envelope as BackupEnvelope;
}

export async function restoreEnvelope(
  database: NeedleMinderDatabase,
  envelope: BackupEnvelope
): Promise<RestoreResult> {
  const data = envelope.data;

  const referencedColorIds = new Set<string>();
  for (const row of data.user_inventory) referencedColorIds.add(row.reference_color_id);
  for (const row of data.project_thread_reservations) referencedColorIds.add(row.reference_color_id);

  if (referencedColorIds.size > 0) {
    const placeholders = Array.from(referencedColorIds).map(() => "?").join(",");
    const presentRows = await database.getAllAsync<{ id: string }>(
      `SELECT id FROM reference_colors WHERE id IN (${placeholders})`,
      Array.from(referencedColorIds)
    );
    const presentIds = new Set(presentRows.map((row) => row.id));
    const missing = Array.from(referencedColorIds).filter((id) => !presentIds.has(id));
    if (missing.length > 0) {
      throw new BackupValidationError(
        `Backup references ${missing.length} catalog color(s) not present in this app version. Aborting restore.`
      );
    }
  }

  const projectIds = new Set(data.projects.map((row) => row.id));
  for (const reservation of data.project_thread_reservations) {
    if (!projectIds.has(reservation.project_id)) {
      throw new BackupValidationError(
        `Backup contains reservations for missing project '${reservation.project_id}'. Aborting restore.`
      );
    }
  }

  await database.execAsync("BEGIN IMMEDIATE TRANSACTION");
  try {
    await database.execAsync("DELETE FROM project_thread_reservations");
    await database.execAsync("DELETE FROM projects");
    await database.execAsync("DELETE FROM user_inventory");
    await database.execAsync("DELETE FROM app_preferences");

    for (const row of data.user_inventory) {
      await database.runAsync(
        `INSERT INTO user_inventory
          (id, reference_color_id, quantity, condition, is_favorite, notes, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          row.id,
          row.reference_color_id,
          row.quantity,
          row.condition,
          row.is_favorite ?? 0,
          row.notes,
          row.created_at,
          row.updated_at
        ]
      );
    }

    for (const row of data.projects) {
      await database.runAsync(
        `INSERT INTO projects
          (id, folder, name, author, canvas_mesh, status, start_date, completed_date, image_uri, notes, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          row.id,
          row.folder,
          row.name,
          row.author,
          row.canvas_mesh,
          row.status,
          row.start_date,
          row.completed_date,
          row.image_uri,
          row.notes,
          row.created_at,
          row.updated_at
        ]
      );
    }

    for (const row of data.project_thread_reservations) {
      await database.runAsync(
        `INSERT INTO project_thread_reservations
          (id, project_id, reference_color_id, quantity, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?)`,
        [
          row.id,
          row.project_id,
          row.reference_color_id,
          row.quantity,
          row.created_at,
          row.updated_at
        ]
      );
    }

    for (const row of data.app_preferences) {
      await database.runAsync(
        `INSERT INTO app_preferences (key, value, updated_at) VALUES (?, ?, ?)`,
        [row.key, row.value, row.updated_at]
      );
    }

    await database.execAsync("COMMIT");
  } catch (error) {
    await database.execAsync("ROLLBACK");
    throw error;
  }

  const warnings: string[] = [];
  const projectsWithImage = data.projects.filter((row) => row.image_uri).length;
  if (projectsWithImage > 0) {
    warnings.push(
      `${projectsWithImage} project photo${projectsWithImage === 1 ? "" : "s"} will need to be retaken.`
    );
  }

  return {
    inserted: {
      user_inventory: data.user_inventory.length,
      projects: data.projects.length,
      project_thread_reservations: data.project_thread_reservations.length,
      app_preferences: data.app_preferences.length
    },
    warnings
  };
}
