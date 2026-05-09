import type { InventoryItem } from "../types";
import { mapReferenceColor } from "./sqliteReferenceColorRepository";
import type { NeedleMinderDatabase } from "./database";
import { createId } from "./createId";
import type { ProjectRepository, SaveProjectInput } from "../projects/projectRepository";
import type { InventoryConsumption, Project, ProjectReservationRecord, ProjectStatus } from "../projects/types";

type ProjectRow = {
  id: string;
  folder: string | null;
  name: string;
  author: string | null;
  canvas_mesh: 13 | 18 | null;
  status: ProjectStatus;
  start_date: string | null;
  completed_date: string | null;
  image_uri: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

type ReservationRow = ProjectRow & {
  reservation_id: string;
  project_id: string;
  reference_color_id: string;
  quantity: number;
  reservation_created_at: string;
  reservation_updated_at: string;
  color_id: string;
  thread_type_id: string;
  color_code: string;
  color_name: string;
  color_family: string;
  hex_rgb: string;
  is_variegated: number;
  thread_subtype: string;
  upc: string | null;
};

type InventoryRow = {
  inventory_id: string;
  inventory_updated_at: string;
  quantity: number;
  condition: "full" | "partial";
  is_favorite: number;
  notes: string | null;
  color_id: string;
  thread_type_id: string;
  color_code: string;
  color_name: string;
  color_family: string;
  hex_rgb: string;
  is_variegated: number;
  thread_subtype: string;
  upc: string | null;
};

export class SqliteProjectRepository implements ProjectRepository {
  constructor(private readonly database: NeedleMinderDatabase) {}

  async listProjects(): Promise<Project[]> {
    const rows = await this.database.getAllAsync<ProjectRow>(
      "SELECT * FROM projects ORDER BY updated_at DESC, name COLLATE NOCASE ASC"
    );
    return rows.map(mapProject);
  }

  async findProjectById(id: string): Promise<Project | null> {
    const row = await this.database.getFirstAsync<ProjectRow>("SELECT * FROM projects WHERE id = ?", [id]);
    return row ? mapProject(row) : null;
  }

  async createProject(input: SaveProjectInput): Promise<string> {
    const id = createId();
    const now = new Date().toISOString();
    await this.database.runAsync(
      `INSERT INTO projects
        (id, folder, name, author, canvas_mesh, status, start_date, completed_date, image_uri, notes, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        input.folder,
        input.name,
        input.author,
        input.canvasMesh,
        input.status,
        input.startDate,
        input.completedDate,
        input.imageUri,
        input.notes,
        now,
        now
      ]
    );
    return id;
  }

  async updateProject(id: string, input: SaveProjectInput): Promise<void> {
    await this.database.runAsync(
      `UPDATE projects
       SET folder = ?, name = ?, author = ?, canvas_mesh = ?, status = ?, start_date = ?, completed_date = ?, image_uri = ?, notes = ?, updated_at = ?
       WHERE id = ?`,
      [
        input.folder,
        input.name,
        input.author,
        input.canvasMesh,
        input.status,
        input.startDate,
        input.completedDate,
        input.imageUri,
        input.notes,
        new Date().toISOString(),
        id
      ]
    );
  }

  async completeProject(id: string, input: SaveProjectInput, plan: InventoryConsumption[]): Promise<void> {
    await this.database.execAsync("BEGIN IMMEDIATE TRANSACTION");

    try {
      for (const change of plan) {
        if (change.remove) {
          await this.database.runAsync("DELETE FROM user_inventory WHERE id = ?", [change.inventoryId]);
        } else {
          await this.database.runAsync(
            "UPDATE user_inventory SET quantity = ?, updated_at = ? WHERE id = ?",
            [change.nextQuantity, new Date().toISOString(), change.inventoryId]
          );
        }
      }

      await this.database.runAsync(
        `UPDATE projects
         SET folder = ?, name = ?, author = ?, canvas_mesh = ?, status = ?, start_date = ?, completed_date = ?, image_uri = ?, notes = ?, updated_at = ?
         WHERE id = ?`,
        [
          input.folder,
          input.name,
          input.author,
          input.canvasMesh,
          "finished",
          input.startDate,
          input.completedDate,
          input.imageUri,
          input.notes,
          new Date().toISOString(),
          id
        ]
      );

      await this.database.execAsync("COMMIT");
    } catch (error) {
      await this.database.execAsync("ROLLBACK");
      throw error;
    }
  }

  async listReservations(): Promise<ProjectReservationRecord[]> {
    const rows = await this.database.getAllAsync<ReservationRow>(reservationSelectSql("ORDER BY p.updated_at DESC, rc.color_code ASC"));
    return rows.map(mapReservationRecord);
  }

  async listReservationsByProjectId(projectId: string): Promise<ProjectReservationRecord[]> {
    const rows = await this.database.getAllAsync<ReservationRow>(
      reservationSelectSql("WHERE ptr.project_id = ? ORDER BY rc.color_code ASC"),
      [projectId]
    );
    return rows.map(mapReservationRecord);
  }

  async listReservationsByReferenceColorId(referenceColorId: string): Promise<ProjectReservationRecord[]> {
    const rows = await this.database.getAllAsync<ReservationRow>(
      reservationSelectSql("WHERE ptr.reference_color_id = ? ORDER BY p.updated_at DESC"),
      [referenceColorId]
    );
    return rows.map(mapReservationRecord);
  }

  async listInventoryByReferenceColorId(referenceColorId: string): Promise<InventoryItem[]> {
    const rows = await this.database.getAllAsync<InventoryRow>(
      `
        SELECT
          ui.id AS inventory_id,
          ui.updated_at AS inventory_updated_at,
          ui.quantity,
          ui.condition,
          ui.is_favorite,
          ui.notes,
          rc.id AS color_id,
          rc.thread_type_id,
          rc.color_code,
          rc.color_name,
          rc.color_family,
          rc.hex_rgb,
          rc.is_variegated,
          rc.thread_subtype,
          rc.upc
        FROM user_inventory ui
        JOIN reference_colors rc ON rc.id = ui.reference_color_id
        WHERE ui.reference_color_id = ?
        ORDER BY CASE ui.condition WHEN 'partial' THEN 0 ELSE 1 END, ui.updated_at ASC
      `,
      [referenceColorId]
    );

    return rows.map(mapInventoryItem);
  }

  async setReservation(projectId: string, referenceColorId: string, quantity: number): Promise<void> {
    const existing = await this.database.getFirstAsync<{ id: string }>(
      "SELECT id FROM project_thread_reservations WHERE project_id = ? AND reference_color_id = ?",
      [projectId, referenceColorId]
    );
    const now = new Date().toISOString();

    if (existing) {
      await this.database.runAsync(
        "UPDATE project_thread_reservations SET quantity = ?, updated_at = ? WHERE id = ?",
        [quantity, now, existing.id]
      );
      return;
    }

    await this.database.runAsync(
      `INSERT INTO project_thread_reservations
        (id, project_id, reference_color_id, quantity, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?)`,
      [createId(), projectId, referenceColorId, quantity, now, now]
    );
  }

  async removeReservation(projectId: string, referenceColorId: string): Promise<void> {
    await this.database.runAsync(
      "DELETE FROM project_thread_reservations WHERE project_id = ? AND reference_color_id = ?",
      [projectId, referenceColorId]
    );
  }

  async clearReservations(projectId: string): Promise<void> {
    await this.database.runAsync("DELETE FROM project_thread_reservations WHERE project_id = ?", [projectId]);
  }
}

function reservationSelectSql(suffix: string): string {
  return `
    SELECT
      p.id,
      p.folder,
      p.name,
      p.author,
      p.canvas_mesh,
      p.status,
      p.start_date,
      p.completed_date,
      p.image_uri,
      p.notes,
      p.created_at,
      p.updated_at,
      ptr.id AS reservation_id,
      ptr.project_id,
      ptr.reference_color_id,
      ptr.quantity,
      ptr.created_at AS reservation_created_at,
      ptr.updated_at AS reservation_updated_at,
      rc.id AS color_id,
      rc.thread_type_id,
      rc.color_code,
      rc.color_name,
      rc.color_family,
      rc.hex_rgb,
      rc.is_variegated,
      rc.thread_subtype,
      rc.upc
    FROM project_thread_reservations ptr
    JOIN projects p ON p.id = ptr.project_id
    JOIN reference_colors rc ON rc.id = ptr.reference_color_id
    ${suffix}
  `;
}

function mapProject(row: ProjectRow): Project {
  return {
    id: row.id,
    folder: row.folder,
    name: row.name,
    author: row.author,
    canvasMesh: row.canvas_mesh,
    status: row.status,
    startDate: row.start_date,
    completedDate: row.completed_date,
    imageUri: row.image_uri,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function mapReservationRecord(row: ReservationRow): ProjectReservationRecord {
  return {
    id: row.reservation_id,
    projectId: row.project_id,
    referenceColorId: row.reference_color_id,
    quantity: row.quantity,
    createdAt: row.reservation_created_at,
    updatedAt: row.reservation_updated_at,
    project: mapProject(row),
    referenceColor: mapReferenceColor({
      id: row.color_id,
      thread_type_id: row.thread_type_id,
      color_code: row.color_code,
      color_name: row.color_name,
      color_family: row.color_family,
      hex_rgb: row.hex_rgb,
      is_variegated: row.is_variegated,
      thread_subtype: row.thread_subtype,
      upc: row.upc
    })
  };
}

function mapInventoryItem(row: InventoryRow): InventoryItem {
  return {
    id: row.inventory_id,
    updatedAt: row.inventory_updated_at,
    quantity: row.quantity,
    condition: row.condition,
    favorite: row.is_favorite === 1,
    notes: row.notes,
    referenceColor: mapReferenceColor({
      id: row.color_id,
      thread_type_id: row.thread_type_id,
      color_code: row.color_code,
      color_name: row.color_name,
      color_family: row.color_family,
      hex_rgb: row.hex_rgb,
      is_variegated: row.is_variegated,
      thread_subtype: row.thread_subtype,
      upc: row.upc
    })
  };
}
