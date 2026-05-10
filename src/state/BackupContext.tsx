import { createContext, useContext } from "react";

import type { ExportResult, ImportResult } from "../backup/backupService";

export type BackupContextValue = {
  exportBackup(): Promise<ExportResult>;
  importBackup(): Promise<ImportResult>;
};

export const BackupContext = createContext<BackupContextValue | null>(null);

export function useBackup(): BackupContextValue {
  const value = useContext(BackupContext);
  if (!value) {
    throw new Error("useBackup must be used within NeedleMinderProvider.");
  }
  return value;
}
