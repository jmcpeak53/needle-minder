import Constants from "expo-constants";

import type { ReferenceColorRepository } from "../catalog/referenceColorRepository";
import type { ThreadTypeRepository } from "../catalog/threadTypeRepository";
import { BackupService } from "../backup/backupService";
import { openNeedleMinderDatabase } from "../db/database";
import { SqliteInventoryRepository } from "../db/sqliteInventoryRepository";
import { SqlitePreferencesRepository } from "../db/sqlitePreferencesRepository";
import { SqliteProjectRepository } from "../db/sqliteProjectRepository";
import { SqliteReferenceColorRepository } from "../db/sqliteReferenceColorRepository";
import { SqliteThreadTypeRepository } from "../db/sqliteThreadTypeRepository";
import { InventoryService } from "../inventory/inventoryService";
import { ProjectService } from "../projects/projectService";
import type { PreferencesRepository } from "../settings/preferencesRepository";

export type NeedleMinderServices = {
  referenceColors: ReferenceColorRepository;
  threadTypes: ThreadTypeRepository;
  preferences: PreferencesRepository;
  inventoryService: InventoryService;
  projectService: ProjectService;
  backup: BackupService;
};

export async function composeNeedleMinderServices(): Promise<NeedleMinderServices> {
  const database = await openNeedleMinderDatabase();
  const appVersion = Constants.expoConfig?.version ?? "unknown";
  return {
    referenceColors: new SqliteReferenceColorRepository(database),
    threadTypes: new SqliteThreadTypeRepository(database),
    preferences: new SqlitePreferencesRepository(database),
    inventoryService: new InventoryService(new SqliteInventoryRepository(database)),
    projectService: new ProjectService(new SqliteProjectRepository(database)),
    backup: new BackupService(database, appVersion)
  };
}
