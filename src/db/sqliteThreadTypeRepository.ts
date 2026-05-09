import type { ThreadTypeRepository } from "../catalog/threadTypeRepository";
import type { ThreadType } from "../types";
import type { NeedleMinderDatabase } from "./database";

type ThreadTypeRow = {
  id: string;
  manufacturer: string;
  product_line: string;
  display_name: string;
  is_active: number;
};

export class SqliteThreadTypeRepository implements ThreadTypeRepository {
  constructor(private readonly database: NeedleMinderDatabase) {}

  async list(): Promise<ThreadType[]> {
    const rows = await this.database.getAllAsync<ThreadTypeRow>(
      "SELECT * FROM thread_types WHERE is_active = 1 ORDER BY display_name"
    );
    return rows.map(mapThreadType);
  }

  async findById(id: string): Promise<ThreadType | null> {
    const row = await this.database.getFirstAsync<ThreadTypeRow>(
      "SELECT * FROM thread_types WHERE id = ?",
      [id]
    );
    return row ? mapThreadType(row) : null;
  }
}

function mapThreadType(row: ThreadTypeRow): ThreadType {
  return {
    id: row.id,
    manufacturer: row.manufacturer,
    productLine: row.product_line,
    displayName: row.display_name,
    isActive: row.is_active === 1
  };
}
