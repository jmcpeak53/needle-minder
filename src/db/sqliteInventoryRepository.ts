import type { AddInventoryInput, InventoryRepository, UpdateInventoryInput } from "../inventory/inventoryRepository";
import type { InventoryItem } from "../types";
import type { NeedleMinderDatabase } from "./database";
import { mapReferenceColor } from "./sqliteReferenceColorRepository";

type InventoryRow = {
  inventory_id: string;
  inventory_updated_at: string;
  quantity: number;
  condition: "full" | "partial";
  notes: string | null;
  color_id: string;
  thread_type_id: string;
  color_code: string;
  color_name: string;
  color_family: string;
  hex_rgb: string;
  is_variegated: number;
  upc: string | null;
};

export class SqliteInventoryRepository implements InventoryRepository {
  constructor(private readonly database: NeedleMinderDatabase) {}

  async list(): Promise<InventoryItem[]> {
    const rows = await this.database.getAllAsync<InventoryRow>(inventorySelectSql("ORDER BY rc.color_code"));
    return rows.map(mapInventoryItem);
  }

  async findById(id: string): Promise<InventoryItem | null> {
    const row = await this.database.getFirstAsync<InventoryRow>(
      inventorySelectSql("WHERE ui.id = ?"),
      [id]
    );
    return row ? mapInventoryItem(row) : null;
  }

  async addOrUpdate(input: AddInventoryInput): Promise<void> {
    const existing = await this.database.getFirstAsync<{ id: string; quantity: number }>(
      "SELECT id, quantity FROM user_inventory WHERE reference_color_id = ? AND condition = ?",
      [input.referenceColorId, input.condition]
    );
    const now = new Date().toISOString();

    if (existing) {
      await this.database.runAsync(
        "UPDATE user_inventory SET quantity = ?, notes = ?, updated_at = ? WHERE id = ?",
        [existing.quantity + input.quantity, input.notes ?? null, now, existing.id]
      );
      return;
    }

    await this.database.runAsync(
      `INSERT INTO user_inventory
        (id, reference_color_id, quantity, condition, notes, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        createId(),
        input.referenceColorId,
        input.quantity,
        input.condition,
        input.notes ?? null,
        now,
        now
      ]
    );
  }

  async update(id: string, input: UpdateInventoryInput): Promise<void> {
    const current = await this.findById(id);
    if (!current) {
      throw new Error("Inventory item not found.");
    }

    await this.database.runAsync(
      "UPDATE user_inventory SET quantity = ?, condition = ?, notes = ?, updated_at = ? WHERE id = ?",
      [
        input.quantity ?? current.quantity,
        input.condition ?? current.condition,
        input.notes === undefined ? current.notes ?? null : input.notes,
        new Date().toISOString(),
        id
      ]
    );
  }

  async remove(id: string): Promise<void> {
    await this.database.runAsync("DELETE FROM user_inventory WHERE id = ?", [id]);
  }
}

function inventorySelectSql(suffix: string): string {
  return `
    SELECT
      ui.id AS inventory_id,
      ui.updated_at AS inventory_updated_at,
      ui.quantity,
      ui.condition,
      ui.notes,
      rc.id AS color_id,
      rc.thread_type_id,
      rc.color_code,
      rc.color_name,
      rc.color_family,
      rc.hex_rgb,
      rc.is_variegated,
      rc.upc
    FROM user_inventory ui
    JOIN reference_colors rc ON rc.id = ui.reference_color_id
    ${suffix}
  `;
}

function mapInventoryItem(row: InventoryRow): InventoryItem {
  return {
    id: row.inventory_id,
    updatedAt: row.inventory_updated_at,
    quantity: row.quantity,
    condition: row.condition,
    notes: row.notes,
    referenceColor: mapReferenceColor({
      id: row.color_id,
      thread_type_id: row.thread_type_id,
      color_code: row.color_code,
      color_name: row.color_name,
      color_family: row.color_family,
      hex_rgb: row.hex_rgb,
      is_variegated: row.is_variegated,
      upc: row.upc
    })
  };
}

function createId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}
