import { createContext, useContext } from "react";

import type { AddInventoryInput, UpdateInventoryInput } from "../inventory/inventoryRepository";
import type { InventoryItem, ThreadCondition } from "../types";

export type SetConditionQuantityInherited = {
  favorite?: boolean;
  notes?: string | null;
};

export type InventoryContextValue = {
  ready: boolean;
  inventory: InventoryItem[];
  addInventory(input: AddInventoryInput): Promise<void>;
  updateInventory(id: string, input: UpdateInventoryInput): Promise<void>;
  toggleFavorite(id: string): Promise<void>;
  decrementInventory(id: string): Promise<void>;
  removeInventory(id: string): Promise<void>;
  setConditionQuantity(
    referenceColorId: string,
    condition: ThreadCondition,
    targetQuantity: number,
    inherited?: SetConditionQuantityInherited
  ): Promise<void>;
};

export const InventoryContext = createContext<InventoryContextValue | null>(null);

export function useInventory(): InventoryContextValue {
  const value = useContext(InventoryContext);
  if (!value) {
    throw new Error("useInventory must be used within NeedleMinderProvider.");
  }
  return value;
}
