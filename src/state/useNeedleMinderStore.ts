import { useCallback, useEffect, useMemo, useState } from "react";

import type { ReferenceColorRepository } from "../catalog/referenceColorRepository";
import { openNeedleMinderDatabase } from "../db/database";
import { SqliteInventoryRepository } from "../db/sqliteInventoryRepository";
import { SqliteReferenceColorRepository } from "../db/sqliteReferenceColorRepository";
import type { AddInventoryInput } from "../inventory/inventoryRepository";
import { InventoryService } from "../inventory/inventoryService";
import type { InventoryItem, ReferenceColor } from "../types";

type StoreState = {
  ready: boolean;
  inventory: InventoryItem[];
  catalog: ReferenceColor[];
  addInventory(input: AddInventoryInput): Promise<void>;
  updateInventory(item: InventoryItem): Promise<void>;
  decrementInventory(id: string): Promise<void>;
  removeInventory(id: string): Promise<void>;
  searchCatalog(query: string): Promise<ReferenceColor[]>;
  refresh(): Promise<void>;
};

export function useNeedleMinderStore(): StoreState {
  const [ready, setReady] = useState(false);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [catalog, setCatalog] = useState<ReferenceColor[]>([]);
  const [repositories, setRepositories] = useState<{
    referenceColors: ReferenceColorRepository;
    inventoryService: InventoryService;
  } | null>(null);

  useEffect(() => {
    let mounted = true;

    openNeedleMinderDatabase().then(async (database) => {
      if (!mounted) {
        return;
      }

      const referenceColors = new SqliteReferenceColorRepository(database);
      const inventoryService = new InventoryService(new SqliteInventoryRepository(database));
      const [loadedCatalog, loadedInventory] = await Promise.all([
        referenceColors.list(),
        inventoryService.list()
      ]);

      setRepositories({ referenceColors, inventoryService });
      setCatalog(loadedCatalog);
      setInventory(loadedInventory);
      setReady(true);
    });

    return () => {
      mounted = false;
    };
  }, []);

  const refresh = useCallback(async () => {
    if (!repositories) {
      return;
    }

    const [loadedCatalog, loadedInventory] = await Promise.all([
      repositories.referenceColors.list(),
      repositories.inventoryService.list()
    ]);

    setCatalog(loadedCatalog);
    setInventory(loadedInventory);
  }, [repositories]);

  return useMemo(
    () => ({
      ready,
      inventory,
      catalog,
      async addInventory(input: AddInventoryInput) {
        if (!repositories) {
          return;
        }

        await repositories.inventoryService.addOrUpdate(input);
        await refresh();
      },
      async updateInventory(item: InventoryItem) {
        if (!repositories) {
          return;
        }

        await repositories.inventoryService.update(item.id, {
          quantity: item.quantity,
          condition: item.condition,
          notes: item.notes
        });
        await refresh();
      },
      async decrementInventory(id: string) {
        if (!repositories) {
          return;
        }

        await repositories.inventoryService.decrement(id);
        await refresh();
      },
      async removeInventory(id: string) {
        if (!repositories) {
          return;
        }

        await repositories.inventoryService.remove(id);
        await refresh();
      },
      async searchCatalog(query: string) {
        if (!repositories) {
          return [];
        }

        return repositories.referenceColors.search(query);
      },
      refresh
    }),
    [catalog, inventory, ready, refresh, repositories]
  );
}
