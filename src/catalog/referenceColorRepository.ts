import type { ReferenceColor } from "../types";

export interface ReferenceColorRepository {
  list(): Promise<ReferenceColor[]>;
  search(query: string): Promise<ReferenceColor[]>;
  listByFamily(family: string): Promise<ReferenceColor[]>;
  findByCode(code: string): Promise<ReferenceColor | null>;
  findByUpc(upc: string): Promise<ReferenceColor | null>;
}
