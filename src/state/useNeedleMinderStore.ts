import { useCallback, useEffect, useMemo, useState } from "react";

import type { ReferenceColorRepository } from "../catalog/referenceColorRepository";
import { openNeedleMinderDatabase } from "../db/database";
import { SqliteInventoryRepository } from "../db/sqliteInventoryRepository";
import { SqliteProjectRepository } from "../db/sqliteProjectRepository";
import { SqliteReferenceColorRepository } from "../db/sqliteReferenceColorRepository";
import type { AddInventoryInput } from "../inventory/inventoryRepository";
import { InventoryService } from "../inventory/inventoryService";
import type { InventoryItem, ReferenceColor } from "../types";
import {
  buildProjectDetail,
  buildProjectReverseLookup,
  buildProjectSummaries,
  buildShoppingShortfalls
} from "../projects/projectMath";
import type { SaveProjectInput } from "../projects/projectRepository";
import { ProjectService } from "../projects/projectService";
import type {
  Project,
  ProjectDetail,
  ProjectLookupReservation,
  ProjectReservationRecord,
  ProjectSummary,
  ShoppingShortfall
} from "../projects/types";

type StoreState = {
  ready: boolean;
  inventory: InventoryItem[];
  catalog: ReferenceColor[];
  projects: Project[];
  projectSummaries: ProjectSummary[];
  shoppingShortfalls: ShoppingShortfall[];
  addInventory(input: AddInventoryInput): Promise<void>;
  updateInventory(item: InventoryItem): Promise<void>;
  decrementInventory(id: string): Promise<void>;
  removeInventory(id: string): Promise<void>;
  searchCatalog(query: string): Promise<ReferenceColor[]>;
  createProject(input: SaveProjectInput): Promise<string>;
  updateProject(id: string, input: SaveProjectInput): Promise<void>;
  setProjectReservation(projectId: string, referenceColorId: string, quantity: number): Promise<void>;
  removeProjectReservation(projectId: string, referenceColorId: string): Promise<void>;
  clearProjectReservations(projectId: string): Promise<void>;
  getProjectDetail(projectId: string): ProjectDetail | null;
  getReservationsByReferenceColor(referenceColorId: string): ProjectLookupReservation[];
  refresh(): Promise<void>;
};

export function useNeedleMinderStore(): StoreState {
  const [ready, setReady] = useState(false);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [catalog, setCatalog] = useState<ReferenceColor[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [reservations, setReservations] = useState<ProjectReservationRecord[]>([]);
  const [repositories, setRepositories] = useState<{
    referenceColors: ReferenceColorRepository;
    inventoryService: InventoryService;
    projectService: ProjectService;
  } | null>(null);

  useEffect(() => {
    let mounted = true;

    openNeedleMinderDatabase().then(async (database) => {
      if (!mounted) {
        return;
      }

      const referenceColors = new SqliteReferenceColorRepository(database);
      const inventoryService = new InventoryService(new SqliteInventoryRepository(database));
      const projectService = new ProjectService(new SqliteProjectRepository(database));
      const [loadedCatalog, loadedInventory, loadedProjects, loadedReservations] = await Promise.all([
        referenceColors.list(),
        inventoryService.list(),
        projectService.listProjects(),
        projectService.listReservations()
      ]);

      setRepositories({ referenceColors, inventoryService, projectService });
      setCatalog(loadedCatalog);
      setInventory(loadedInventory);
      setProjects(loadedProjects);
      setReservations(loadedReservations);
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

    const [loadedCatalog, loadedInventory, loadedProjects, loadedReservations] = await Promise.all([
      repositories.referenceColors.list(),
      repositories.inventoryService.list(),
      repositories.projectService.listProjects(),
      repositories.projectService.listReservations()
    ]);

    setCatalog(loadedCatalog);
    setInventory(loadedInventory);
    setProjects(loadedProjects);
    setReservations(loadedReservations);
  }, [repositories]);

  const projectSummaries = useMemo(
    () => buildProjectSummaries(projects, reservations, inventory),
    [projects, reservations, inventory]
  );

  const shoppingShortfalls = useMemo(
    () => buildShoppingShortfalls(reservations, inventory),
    [reservations, inventory]
  );

  return useMemo(
    () => ({
      ready,
      inventory,
      catalog,
      projects,
      projectSummaries,
      shoppingShortfalls,
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
      async createProject(input: SaveProjectInput) {
        if (!repositories) {
          return "";
        }

        const id = await repositories.projectService.createProject(input);
        await refresh();
        return id;
      },
      async updateProject(id: string, input: SaveProjectInput) {
        if (!repositories) {
          return;
        }

        await repositories.projectService.updateProject(id, input);
        await refresh();
      },
      async setProjectReservation(projectId: string, referenceColorId: string, quantity: number) {
        if (!repositories) {
          return;
        }

        await repositories.projectService.setReservation(projectId, referenceColorId, quantity);
        await refresh();
      },
      async removeProjectReservation(projectId: string, referenceColorId: string) {
        if (!repositories) {
          return;
        }

        await repositories.projectService.removeReservation(projectId, referenceColorId);
        await refresh();
      },
      async clearProjectReservations(projectId: string) {
        if (!repositories) {
          return;
        }

        await repositories.projectService.clearReservations(projectId);
        await refresh();
      },
      getProjectDetail(projectId: string) {
        const project = projects.find((item) => item.id === projectId);
        if (!project) {
          return null;
        }

        return buildProjectDetail(project, reservations, inventory);
      },
      getReservationsByReferenceColor(referenceColorId: string) {
        return buildProjectReverseLookup(referenceColorId, reservations, inventory);
      },
      refresh
    }),
    [
      catalog,
      inventory,
      projectSummaries,
      projects,
      ready,
      refresh,
      repositories,
      reservations,
      shoppingShortfalls
    ]
  );
}
