import type { InventoryItem, ThreadCondition } from "../types";

export type AddInventoryInput = {
  referenceColorId: string;
  quantity: number;
  condition: ThreadCondition;
  favorite?: boolean;
  notes?: string | null;
};

export type UpdateInventoryInput = {
  quantity?: number;
  condition?: ThreadCondition;
  favorite?: boolean;
  notes?: string | null;
};

export interface InventoryRepository {
  list(): Promise<InventoryItem[]>;
  findById(id: string): Promise<InventoryItem | null>;
  addOrUpdate(input: AddInventoryInput): Promise<void>;
  update(id: string, input: UpdateInventoryInput): Promise<void>;
  remove(id: string): Promise<void>;
}
