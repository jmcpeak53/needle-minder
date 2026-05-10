export const BACKUP_FORMAT = "needle-minder-backup";
export const ENVELOPE_VERSION = 1;

export type UserInventoryRow = {
  id: string;
  reference_color_id: string;
  quantity: number;
  condition: "full" | "partial";
  is_favorite: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type ProjectRow = {
  id: string;
  folder: string | null;
  name: string;
  author: string | null;
  canvas_mesh: number | null;
  status: "not_started" | "pattern" | "wip" | "finished";
  start_date: string | null;
  completed_date: string | null;
  image_uri: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type ProjectThreadReservationRow = {
  id: string;
  project_id: string;
  reference_color_id: string;
  quantity: number;
  created_at: string;
  updated_at: string;
};

export type AppPreferenceRow = {
  key: string;
  value: string;
  updated_at: string;
};

export type BackupData = {
  user_inventory: UserInventoryRow[];
  projects: ProjectRow[];
  project_thread_reservations: ProjectThreadReservationRow[];
  app_preferences: AppPreferenceRow[];
};

export type BackupEnvelope = {
  format: typeof BACKUP_FORMAT;
  envelopeVersion: number;
  schemaVersion: number;
  exportedAt: string;
  appVersion: string;
  data: BackupData;
};

export type RestoreResult = {
  inserted: {
    user_inventory: number;
    projects: number;
    project_thread_reservations: number;
    app_preferences: number;
  };
  warnings: string[];
};
