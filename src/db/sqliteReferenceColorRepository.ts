import type { ReferenceColor } from "../types";
import type { NeedleMinderDatabase } from "./database";
import type { ReferenceColorRepository } from "../catalog/referenceColorRepository";

type ReferenceColorRow = {
  id: string;
  thread_type_id: string;
  color_code: string;
  color_name: string;
  color_family: string;
  hex_rgb: string;
  is_variegated: number;
  upc: string | null;
};

export class SqliteReferenceColorRepository implements ReferenceColorRepository {
  constructor(private readonly database: NeedleMinderDatabase) {}

  async list(): Promise<ReferenceColor[]> {
    const rows = await this.database.getAllAsync<ReferenceColorRow>(
      "SELECT * FROM reference_colors ORDER BY color_code"
    );
    return rows.map(mapReferenceColor);
  }

  async search(query: string): Promise<ReferenceColor[]> {
    const normalized = `%${query.trim()}%`;
    const rows = await this.database.getAllAsync<ReferenceColorRow>(
      `SELECT * FROM reference_colors
       WHERE color_code LIKE ? OR color_name LIKE ? OR color_family LIKE ?
       ORDER BY color_code`,
      [normalized, normalized, normalized]
    );
    return rows.map(mapReferenceColor);
  }

  async listByFamily(family: string): Promise<ReferenceColor[]> {
    const rows = await this.database.getAllAsync<ReferenceColorRow>(
      "SELECT * FROM reference_colors WHERE color_family = ? ORDER BY color_code",
      [family]
    );
    return rows.map(mapReferenceColor);
  }

  async findByCode(code: string): Promise<ReferenceColor | null> {
    const row = await this.database.getFirstAsync<ReferenceColorRow>(
      "SELECT * FROM reference_colors WHERE color_code = ?",
      [code.trim().toUpperCase()]
    );
    return row ? mapReferenceColor(row) : null;
  }

  async findByUpc(upc: string): Promise<ReferenceColor | null> {
    const row = await this.database.getFirstAsync<ReferenceColorRow>(
      "SELECT * FROM reference_colors WHERE upc = ?",
      [upc]
    );
    return row ? mapReferenceColor(row) : null;
  }
}

export function mapReferenceColor(row: ReferenceColorRow): ReferenceColor {
  return {
    id: row.id,
    threadTypeId: row.thread_type_id,
    colorCode: row.color_code,
    colorName: row.color_name,
    colorFamily: row.color_family,
    hexRgb: row.hex_rgb,
    isVariegated: row.is_variegated === 1,
    upc: row.upc
  };
}
