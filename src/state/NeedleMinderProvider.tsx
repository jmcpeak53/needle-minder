import { useCallback, useEffect, useMemo, useState } from "react";
import type { PropsWithChildren } from "react";

import { normalizeCatalogFilter } from "../catalog/catalogFilter";
import type { CatalogFilter } from "../catalog/catalogFilter";
import type { AddInventoryInput, UpdateInventoryInput } from "../inventory/inventoryRepository";
import {
  buildProjectDetail,
  buildProjectReverseLookup,
  buildProjectSummaries,
  buildShoppingShortfalls
} from "../projects/projectMath";
import type { SaveProjectInput } from "../projects/projectRepository";
import type { Project, ProjectReservationRecord } from "../projects/types";
import type { InventoryItem, ReferenceColor, ThreadType } from "../types";
import { BackupContext } from "./BackupContext";
import { CatalogContext } from "./CatalogContext";
import { composeNeedleMinderServices } from "./composeServices";
import type { NeedleMinderServices } from "./composeServices";
import { InventoryContext } from "./InventoryContext";
import { ProjectsContext } from "./ProjectsContext";

export function NeedleMinderProvider({ children }: PropsWithChildren) {
  const [ready, setReady] = useState(false);
  const [services, setServices] = useState<NeedleMinderServices | null>(null);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [catalog, setCatalog] = useState<ReferenceColor[]>([]);
  const [threadTypes, setThreadTypes] = useState<ThreadType[]>([]);
  const [defaultCatalogFilter, setDefaultCatalogFilterState] = useState<CatalogFilter>("all");
  const [sessionCatalogThreadTypeId, setSessionCatalogThreadTypeIdState] = useState<string | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [reservations, setReservations] = useState<ProjectReservationRecord[]>([]);

  useEffect(() => {
    let mounted = true;

    composeNeedleMinderServices().then(async (svc) => {
      if (!mounted) return;

      const [
        loadedCatalog,
        loadedThreadTypes,
        savedDefaultFilter,
        savedSessionId,
        loadedInventory,
        loadedProjects,
        loadedReservations
      ] = await Promise.all([
        svc.referenceColors.list(),
        svc.threadTypes.list(),
        svc.preferences.getDefaultCatalogFilter(),
        svc.preferences.getSessionCatalogThreadTypeId(),
        svc.inventoryService.list(),
        svc.projectService.listProjects(),
        svc.projectService.listReservations()
      ]);

      const normalizedFilter = normalizeCatalogFilter(savedDefaultFilter, loadedThreadTypes);
      const normalizedSessionId = loadedThreadTypes.some((t) => t.id === savedSessionId)
        ? savedSessionId
        : null;

      if (normalizedFilter !== savedDefaultFilter) {
        await svc.preferences.setDefaultCatalogFilter(normalizedFilter);
      }
      if (savedSessionId && !normalizedSessionId) {
        await svc.preferences.clearSessionCatalogThreadTypeId();
      }

      setServices(svc);
      setCatalog(loadedCatalog);
      setThreadTypes(loadedThreadTypes);
      setDefaultCatalogFilterState(normalizedFilter);
      setSessionCatalogThreadTypeIdState(normalizedSessionId);
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
    if (!services) return;

    const [
      nextCatalog,
      nextThreadTypes,
      savedFilter,
      savedSessionId,
      nextInventory,
      nextProjects,
      nextReservations
    ] = await Promise.all([
      services.referenceColors.list(),
      services.threadTypes.list(),
      services.preferences.getDefaultCatalogFilter(),
      services.preferences.getSessionCatalogThreadTypeId(),
      services.inventoryService.list(),
      services.projectService.listProjects(),
      services.projectService.listReservations()
    ]);

    const normalizedFilter = normalizeCatalogFilter(savedFilter, nextThreadTypes);
    const normalizedSessionId = nextThreadTypes.some((t) => t.id === savedSessionId)
      ? savedSessionId
      : null;

    if (normalizedFilter !== savedFilter) {
      await services.preferences.setDefaultCatalogFilter(normalizedFilter);
    }
    if (savedSessionId && !normalizedSessionId) {
      await services.preferences.clearSessionCatalogThreadTypeId();
    }

    setCatalog(nextCatalog);
    setThreadTypes(nextThreadTypes);
    setDefaultCatalogFilterState(normalizedFilter);
    setSessionCatalogThreadTypeIdState(normalizedSessionId);
    setInventory(nextInventory);
    setProjects(nextProjects);
    setReservations(nextReservations);
  }, [services]);

  const projectSummaries = useMemo(
    () => buildProjectSummaries(projects, reservations, inventory),
    [projects, reservations, inventory]
  );

  const shoppingShortfalls = useMemo(
    () => buildShoppingShortfalls(reservations, inventory),
    [reservations, inventory]
  );

  const inventoryValue = useMemo(
    () => ({
      ready,
      inventory,
      async addInventory(input: AddInventoryInput) {
        if (!services) return;
        await services.inventoryService.addOrUpdate(input);
        await refresh();
      },
      async updateInventory(id: string, input: UpdateInventoryInput) {
        if (!services) return;
        await services.inventoryService.update(id, input);
        await refresh();
      },
      async toggleFavorite(id: string) {
        if (!services) return;
        const item = inventory.find((i) => i.id === id);
        if (!item) return;
        await services.inventoryService.update(id, { favorite: !item.favorite });
        await refresh();
      },
      async decrementInventory(id: string) {
        if (!services) return;
        await services.inventoryService.decrement(id);
        await refresh();
      },
      async removeInventory(id: string) {
        if (!services) return;
        await services.inventoryService.remove(id);
        await refresh();
      }
    }),
    [ready, inventory, services, refresh]
  );

  const catalogValue = useMemo(
    () => ({
      ready,
      catalog,
      threadTypes,
      defaultCatalogFilter,
      sessionCatalogThreadTypeId,
      async searchCatalog(query: string) {
        if (!services) return [];
        return services.referenceColors.search(query);
      },
      async setDefaultCatalogFilter(filter: CatalogFilter) {
        if (!services) return;
        const normalized = normalizeCatalogFilter(filter, threadTypes);
        await services.preferences.setDefaultCatalogFilter(normalized);
        setDefaultCatalogFilterState(normalized);
      },
      async setSessionCatalogThreadTypeId(threadTypeId: string) {
        if (!services) return;
        if (!threadTypes.some((t) => t.id === threadTypeId)) return;
        await services.preferences.setSessionCatalogThreadTypeId(threadTypeId);
        setSessionCatalogThreadTypeIdState(threadTypeId);
      },
      async clearSessionCatalogThreadTypeId() {
        if (!services) return;
        await services.preferences.clearSessionCatalogThreadTypeId();
        setSessionCatalogThreadTypeIdState(null);
      },
      getThreadTypeById(threadTypeId: string) {
        return threadTypes.find((t) => t.id === threadTypeId) ?? null;
      },
      getThreadTypeDisplayName(threadTypeId: string) {
        return threadTypes.find((t) => t.id === threadTypeId)?.displayName ?? threadTypeId;
      }
    }),
    [ready, catalog, threadTypes, defaultCatalogFilter, sessionCatalogThreadTypeId, services]
  );

  const projectsValue = useMemo(
    () => ({
      ready,
      projects,
      projectSummaries,
      shoppingShortfalls,
      async createProject(input: SaveProjectInput) {
        if (!services) return "";
        const id = await services.projectService.createProject(input);
        await refresh();
        return id;
      },
      async updateProject(id: string, input: SaveProjectInput) {
        if (!services) return;
        await services.projectService.updateProject(id, input);
        await refresh();
      },
      async setProjectReservation(
        projectId: string,
        referenceColorId: string,
        quantity: number
      ) {
        if (!services) return;
        await services.projectService.setReservation(projectId, referenceColorId, quantity);
        await refresh();
      },
      async removeProjectReservation(projectId: string, referenceColorId: string) {
        if (!services) return;
        await services.projectService.removeReservation(projectId, referenceColorId);
        await refresh();
      },
      async clearProjectReservations(projectId: string) {
        if (!services) return;
        await services.projectService.clearReservations(projectId);
        await refresh();
      },
      getProjectDetail(projectId: string) {
        const project = projects.find((p) => p.id === projectId);
        if (!project) return null;
        return buildProjectDetail(project, reservations, inventory);
      },
      getReservationsByReferenceColor(referenceColorId: string) {
        return buildProjectReverseLookup(referenceColorId, reservations, inventory);
      }
    }),
    [ready, projects, projectSummaries, shoppingShortfalls, services, refresh, reservations, inventory]
  );

  const backupValue = useMemo(
    () => ({
      async exportBackup() {
        if (!services) throw new Error("Services not ready.");
        return services.backup.exportToFile();
      },
      async importBackup() {
        if (!services) throw new Error("Services not ready.");
        const result = await services.backup.importFromFile();
        if (result.kind === "restored") {
          await refresh();
        }
        return result;
      }
    }),
    [services, refresh]
  );

  return (
    <BackupContext.Provider value={backupValue}>
      <InventoryContext.Provider value={inventoryValue}>
        <CatalogContext.Provider value={catalogValue}>
          <ProjectsContext.Provider value={projectsValue}>
            {children}
          </ProjectsContext.Provider>
        </CatalogContext.Provider>
      </InventoryContext.Provider>
    </BackupContext.Provider>
  );
}
