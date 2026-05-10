import * as DocumentPicker from "expo-document-picker";
import { Directory, File, Paths } from "expo-file-system";
import * as Sharing from "expo-sharing";

import type { NeedleMinderDatabase } from "../db/database";
import {
  buildEnvelope,
  collectBackupData,
  parseEnvelope,
  restoreEnvelope,
  serializeEnvelope
} from "./envelope";
import type { BackupEnvelope, RestoreResult } from "./types";

export type ExportResult =
  | { kind: "shared"; uri: string; rowCounts: BackupRowCounts }
  | { kind: "saved-locally"; uri: string; rowCounts: BackupRowCounts };

export type ImportResult =
  | { kind: "canceled" }
  | { kind: "restored"; result: RestoreResult };

export type BackupRowCounts = {
  user_inventory: number;
  projects: number;
  project_thread_reservations: number;
  app_preferences: number;
};

export class BackupService {
  constructor(
    private readonly database: NeedleMinderDatabase,
    private readonly appVersion: string
  ) {}

  async exportToFile(): Promise<ExportResult> {
    const data = await collectBackupData(this.database);
    const envelope = buildEnvelope(data, this.appVersion);
    const json = serializeEnvelope(envelope);

    const directory = new Directory(Paths.document, "backups");
    if (!directory.exists) {
      directory.create({ intermediates: true, idempotent: true });
    }

    const fileName = `needle-minder-backup-${formatTimestamp(new Date())}.json`;
    const file = new File(directory, fileName);
    if (file.exists) {
      file.delete();
    }
    file.create();
    file.write(json);

    const rowCounts: BackupRowCounts = {
      user_inventory: data.user_inventory.length,
      projects: data.projects.length,
      project_thread_reservations: data.project_thread_reservations.length,
      app_preferences: data.app_preferences.length
    };

    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(file.uri, {
        mimeType: "application/json",
        dialogTitle: "Save Needle Minder backup",
        UTI: "public.json"
      });
      return { kind: "shared", uri: file.uri, rowCounts };
    }

    return { kind: "saved-locally", uri: file.uri, rowCounts };
  }

  async importFromFile(): Promise<ImportResult> {
    const picked = await DocumentPicker.getDocumentAsync({
      type: ["application/json", "text/plain", "*/*"],
      copyToCacheDirectory: true,
      multiple: false
    });

    if (picked.canceled || !picked.assets || picked.assets.length === 0) {
      return { kind: "canceled" };
    }

    const asset = picked.assets[0];
    const text = await new File(asset.uri).text();
    const envelope: BackupEnvelope = parseEnvelope(text);
    const result = await restoreEnvelope(this.database, envelope);
    return { kind: "restored", result };
  }
}

function formatTimestamp(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}` +
    `-${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}`
  );
}
