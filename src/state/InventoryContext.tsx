import { createContext, useContext } from "react";

import type { AddInventoryInput } from "../inventory/inventoryRepository";
import type { InventoryItem } from "../types";

export type InventoryContextValue = {
  ready: boolean;
  inventory: InventoryItem[];
  addInventory(input: AddInventoryInput): Promise<void>;
  updateInventory(item: InventoryItem): Promise<void>;
  toggleFavorite(id: string): Promise<void>;
  decrementInventory(id: string): Promise<void>;
  removeInventory(id: string): Promise<void>;
};

export const InventoryContext = createContext<InventoryContextValue | null>(null);

export function useInventory(): InventoryContextValue {
  const value = useContext(InventoryContext);
  if (!value) {
    throw new Error("useInventory must be used within NeedleMinderProvider.");
  }
  return value;
}
