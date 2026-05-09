import type { CatalogFilter } from "../catalog/catalogFilter";

export interface PreferencesRepository {
  getDefaultCatalogFilter(): Promise<CatalogFilter>;
  setDefaultCatalogFilter(filter: CatalogFilter): Promise<void>;
  getSessionCatalogThreadTypeId(): Promise<string | null>;
  setSessionCatalogThreadTypeId(threadTypeId: string): Promise<void>;
  clearSessionCatalogThreadTypeId(): Promise<void>;
}
