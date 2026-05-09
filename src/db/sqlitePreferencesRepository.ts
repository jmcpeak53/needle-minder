import type { CatalogFilter } from "../catalog/catalogFilter";
import type { PreferencesRepository } from "../settings/preferencesRepository";
import type { NeedleMinderDatabase } from "./database";

const DEFAULT_CATALOG_FILTER_KEY = "default_catalog_filter";
const SESSION_CATALOG_THREAD_TYPE_ID_KEY = "session_catalog_thread_type_id";

type PreferenceRow = {
  value: string;
};

export class SqlitePreferencesRepository implements PreferencesRepository {
  constructor(private readonly database: NeedleMinderDatabase) {}

  async getDefaultCatalogFilter(): Promise<CatalogFilter> {
    const row = await this.database.getFirstAsync<PreferenceRow>(
      "SELECT value FROM app_preferences WHERE key = ?",
      [DEFAULT_CATALOG_FILTER_KEY]
    );
    return (row?.value as CatalogFilter | undefined) ?? "all";
  }

  async setDefaultCatalogFilter(filter: CatalogFilter): Promise<void> {
    await this.database.runAsync(
      `INSERT INTO app_preferences(key, value, updated_at)
       VALUES (?, ?, ?)
       ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`,
      [DEFAULT_CATALOG_FILTER_KEY, filter, new Date().toISOString()]
    );
  }

  async getSessionCatalogThreadTypeId(): Promise<string | null> {
    const row = await this.database.getFirstAsync<PreferenceRow>(
      "SELECT value FROM app_preferences WHERE key = ?",
      [SESSION_CATALOG_THREAD_TYPE_ID_KEY]
    );
    return row?.value ?? null;
  }

  async setSessionCatalogThreadTypeId(threadTypeId: string): Promise<void> {
    await this.database.runAsync(
      `INSERT INTO app_preferences(key, value, updated_at)
       VALUES (?, ?, ?)
       ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`,
      [SESSION_CATALOG_THREAD_TYPE_ID_KEY, threadTypeId, new Date().toISOString()]
    );
  }

  async clearSessionCatalogThreadTypeId(): Promise<void> {
    await this.database.runAsync("DELETE FROM app_preferences WHERE key = ?", [
      SESSION_CATALOG_THREAD_TYPE_ID_KEY
    ]);
  }
}
