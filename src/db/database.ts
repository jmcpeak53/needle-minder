import * as SQLite from "expo-sqlite";

import { referenceColorFixture, threadTypeFixture } from "../data/referenceCatalog.fixture";

export type NeedleMinderDatabase = SQLite.SQLiteDatabase;

export const SCHEMA_VERSION = 2;

export async function openNeedleMinderDatabase(): Promise<NeedleMinderDatabase> {
  const database = await SQLite.openDatabaseAsync("needle-minder.db");
  await migrate(database);
  await seedReferenceData(database);
  return database;
}

async function migrate(database: NeedleMinderDatabase): Promise<void> {
  await database.execAsync(`
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS thread_types (
      id TEXT PRIMARY KEY NOT NULL,
      manufacturer TEXT NOT NULL,
      product_line TEXT NOT NULL,
      display_name TEXT NOT NULL,
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS reference_colors (
      id TEXT PRIMARY KEY NOT NULL,
      thread_type_id TEXT NOT NULL REFERENCES thread_types(id),
      color_code TEXT NOT NULL,
      color_name TEXT NOT NULL,
      color_family TEXT NOT NULL,
      hex_rgb TEXT NOT NULL,
      is_variegated INTEGER NOT NULL DEFAULT 0,
      thread_subtype TEXT NOT NULL DEFAULT 'solid',
      upc TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE UNIQUE INDEX IF NOT EXISTS reference_colors_thread_color_unique
      ON reference_colors(thread_type_id, color_code);

    CREATE TABLE IF NOT EXISTS user_inventory (
      id TEXT PRIMARY KEY NOT NULL,
      reference_color_id TEXT NOT NULL REFERENCES reference_colors(id),
      quantity INTEGER NOT NULL CHECK(quantity > 0),
      condition TEXT NOT NULL CHECK(condition IN ('full', 'partial')),
      notes TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY NOT NULL,
      folder TEXT,
      name TEXT NOT NULL,
      author TEXT,
      canvas_mesh INTEGER CHECK(canvas_mesh IS NULL OR canvas_mesh IN (13, 18)),
      status TEXT NOT NULL CHECK(status IN ('not_started', 'pattern', 'wip', 'finished')),
      start_date TEXT,
      completed_date TEXT,
      image_uri TEXT,
      notes TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      CHECK (completed_date IS NULL OR start_date IS NULL OR completed_date >= start_date)
    );

    CREATE TABLE IF NOT EXISTS project_thread_reservations (
      id TEXT PRIMARY KEY NOT NULL,
      project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      reference_color_id TEXT NOT NULL REFERENCES reference_colors(id),
      quantity INTEGER NOT NULL CHECK(quantity > 0),
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE UNIQUE INDEX IF NOT EXISTS project_thread_reservations_project_color_unique
      ON project_thread_reservations(project_id, reference_color_id);

    CREATE TABLE IF NOT EXISTS app_preferences (
      key TEXT PRIMARY KEY NOT NULL,
      value TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);

  try {
    await database.execAsync(`ALTER TABLE reference_colors ADD COLUMN thread_subtype TEXT`);
  } catch {
    // column already exists on an existing device database
  }
  await database.execAsync(
    `UPDATE reference_colors SET thread_subtype = 'solid' WHERE thread_subtype IS NULL`
  );

  try {
    await database.execAsync(
      `ALTER TABLE user_inventory ADD COLUMN is_favorite INTEGER NOT NULL DEFAULT 0`
    );
  } catch {
    // column already exists on an existing device database
  }
}

export async function seedReferenceData(database: NeedleMinderDatabase): Promise<void> {
  const now = new Date().toISOString();

  for (const threadType of threadTypeFixture) {
    await database.runAsync(
      `INSERT INTO thread_types
        (id, manufacturer, product_line, display_name, is_active, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET
         manufacturer = excluded.manufacturer,
         product_line = excluded.product_line,
         display_name = excluded.display_name,
         is_active = excluded.is_active,
         updated_at = excluded.updated_at`,
      [
        threadType.id,
        threadType.manufacturer,
        threadType.productLine,
        threadType.displayName,
        threadType.isActive ? 1 : 0,
        now,
        now
      ]
    );
  }

  for (const color of referenceColorFixture) {
    await database.runAsync(
      `INSERT INTO reference_colors
        (id, thread_type_id, color_code, color_name, color_family, hex_rgb, is_variegated, thread_subtype, upc, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(thread_type_id, color_code) DO UPDATE SET
         color_name = excluded.color_name,
         color_family = excluded.color_family,
         hex_rgb = excluded.hex_rgb,
         is_variegated = excluded.is_variegated,
         thread_subtype = excluded.thread_subtype,
         upc = excluded.upc,
         updated_at = excluded.updated_at`,
      [
        color.id,
        color.threadTypeId,
        color.colorCode,
        color.colorName,
        color.colorFamily,
        color.hexRgb,
        color.isVariegated ? 1 : 0,
        color.threadSubtype,
        color.upc ?? null,
        now,
        now
      ]
    );
  }
}
