import { useCallback, useEffect, useMemo, useState } from "react";

import type { CatalogFilter } from "../catalog/catalogFilter";
import { normalizeCatalogFilter } from "../catalog/catalogFilter";
import type { ReferenceColorRepository } from "../catalog/referenceColorRepository";
import type { ThreadTypeRepository } from "../catalog/threadTypeRepository";
import { openNeedleMinderDatabase } from "../db/database";
import { SqliteInventoryRepository } from "../db/sqliteInventoryRepository";
import { SqlitePreferencesRepository } from "../db/sqlitePreferencesRepository";
import { SqliteProjectRepository } from "../db/sqliteProjectRepository";
import { SqliteReferenceColorRepository } from "../db/sqliteReferenceColorRepository";
import { SqliteThreadTypeRepository } from "../db/sqliteThreadTypeRepository";
import type { AddInventoryInput } from "../inventory/inventoryRepository";
import { InventoryService } from "../inventory/inventoryService";
import type { InventoryItem, ReferenceColor, ThreadType } from "../types";
import {
  buildProjectDetail,
  buildProjectReverseLookup,
  buildProjectSummaries,
  buildShoppingShortfalls
} from "../projects/projectMath";
import type { SaveProjectInput } from "../projects/projectRepository";
import { ProjectService } from "../projects/projectService";
import type { PreferencesRepository } from "../settings/preferencesRepository";
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
  threadTypes: ThreadType[];
  defaultCatalogFilter: CatalogFilter;
  sessionCatalogThreadTypeId: string | null;
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
  setDefaultCatalogFilter(filter: CatalogFilter): Promise<void>;
  setSessionCatalogThreadTypeId(threadTypeId: string): Promise<void>;
  clearSessionCatalogThreadTypeId(): Promise<void>;
  getThreadTypeById(threadTypeId: string): ThreadType | null;
  getThreadTypeDisplayName(threadTypeId: string): string;
  getProjectDetail(projectId: string): ProjectDetail | null;
  getReservationsByReferenceColor(referenceColorId: string): ProjectLookupReservation[];
  refresh(): Promise<void>;
};

export function useNeedleMinderStore(): StoreState {
  const [ready, setReady] = useState(false);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [catalog, setCatalog] = useState<ReferenceColor[]>([]);
  const [threadTypes, setThreadTypes] = useState<ThreadType[]>([]);
  const [defaultCatalogFilter, setDefaultCatalogFilterState] = useState<CatalogFilter>("all");
  const [sessionCatalogThreadTypeId, setSessionCatalogThreadTypeIdState] = useState<string | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [reservations, setReservations] = useState<ProjectReservationRecord[]>([]);
  const [repositories, setRepositories] = useState<{
    referenceColors: ReferenceColorRepository;
    threadTypes: ThreadTypeRepository;
    preferences: PreferencesRepository;
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
      const threadTypes = new SqliteThreadTypeRepository(database);
      const preferences = new SqlitePreferencesRepository(database);
      const inventoryService = new InventoryService(new SqliteInventoryRepository(database));
      const projectService = new ProjectService(new SqliteProjectRepository(database));
      const [loadedCatalog, loadedThreadTypes, savedDefaultFilter, savedSessionCatalogThreadTypeId, loadedInventory, loadedProjects, loadedReservations] = await Promise.all([
        referenceColors.list(),
        threadTypes.list(),
        preferences.getDefaultCatalogFilter(),
        preferences.getSessionCatalogThreadTypeId(),
        inventoryService.list(),
        projectService.listProjects(),
        projectService.listReservations()
      ]);

      const normalizedDefaultFilter = normalizeCatalogFilter(savedDefaultFilter, loadedThreadTypes);
      const normalizedSessionCatalogThreadTypeId = loadedThreadTypes.some((item) => item.id === savedSessionCatalogThreadTypeId)
        ? savedSessionCatalogThreadTypeId
        : null;

      if (normalizedDefaultFilter !== savedDefaultFilter) {
        await preferences.setDefaultCatalogFilter(normalizedDefaultFilter);
      }

      if (savedSessionCatalogThreadTypeId && !normalizedSessionCatalogThreadTypeId) {
        await preferences.clearSessionCatalogThreadTypeId();
      }

      setRepositories({ referenceColors, threadTypes, preferences, inventoryService, projectService });
      setCatalog(loadedCatalog);
      setThreadTypes(loadedThreadTypes);
      setDefaultCatalogFilterState(normalizedDefaultFilter);
      setSessionCatalogThreadTypeIdState(normalizedSessionCatalogThreadTypeId);
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

    const [
      nextCatalog,
      nextThreadTypes,
      savedDefaultFilter,
      savedSessionCatalogThreadTypeId,
      nextInventory,
      nextProjects,
      nextReservations
    ] = await Promise.all([
      repositories.referenceColors.list(),
      repositories.threadTypes.list(),
      repositories.preferences.getDefaultCatalogFilter(),
      repositories.preferences.getSessionCatalogThreadTypeId(),
      repositories.inventoryService.list(),
      repositories.projectService.listProjects(),
      repositories.projectService.listReservations()
    ]);

    const normalizedDefaultFilter = normalizeCatalogFilter(savedDefaultFilter, nextThreadTypes);
    const normalizedSessionCatalogThreadTypeId = nextThreadTypes.some((item) => item.id === savedSessionCatalogThreadTypeId)
      ? savedSessionCatalogThreadTypeId
      : null;

    if (normalizedDefaultFilter !== savedDefaultFilter) {
      await repositories.preferences.setDefaultCatalogFilter(normalizedDefaultFilter);
    }

    if (savedSessionCatalogThreadTypeId && !normalizedSessionCatalogThreadTypeId) {
      await repositories.preferences.clearSessionCatalogThreadTypeId();
    }

    setCatalog(nextCatalog);
    setThreadTypes(nextThreadTypes);
    setDefaultCatalogFilterState(normalizedDefaultFilter);
    setSessionCatalogThreadTypeIdState(normalizedSessionCatalogThreadTypeId);
    setInventory(nextInventory);
    setProjects(nextProjects);
    setReservations(nextReservations);
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
      threadTypes,
      defaultCatalogFilter,
      sessionCatalogThreadTypeId,
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
      async setDefaultCatalogFilter(filter: CatalogFilter) {
        if (!repositories) {
          return;
        }

        const normalized = normalizeCatalogFilter(filter, threadTypes);
        await repositories.preferences.setDefaultCatalogFilter(normalized);
        setDefaultCatalogFilterState(normalized);
      },
      async setSessionCatalogThreadTypeId(threadTypeId: string) {
        if (!repositories) {
          return;
        }

        if (!threadTypes.some((threadType) => threadType.id === threadTypeId)) {
          return;
        }

        await repositories.preferences.setSessionCatalogThreadTypeId(threadTypeId);
        setSessionCatalogThreadTypeIdState(threadTypeId);
      },
      async clearSessionCatalogThreadTypeId() {
        if (!repositories) {
          return;
        }

        await repositories.preferences.clearSessionCatalogThreadTypeId();
        setSessionCatalogThreadTypeIdState(null);
      },
      getThreadTypeById(threadTypeId: string) {
        return threadTypes.find((threadType) => threadType.id === threadTypeId) ?? null;
      },
      getThreadTypeDisplayName(threadTypeId: string) {
        return threadTypes.find((threadType) => threadType.id === threadTypeId)?.displayName ?? threadTypeId;
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
      defaultCatalogFilter,
      inventory,
      projectSummaries,
      projects,
      ready,
      refresh,
      repositories,
      reservations,
      sessionCatalogThreadTypeId,
      shoppingShortfalls,
      threadTypes
    ]
  );
}
