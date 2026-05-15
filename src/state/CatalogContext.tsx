import { createContext, useContext } from "react";

import type { CatalogFilter } from "../catalog/catalogFilter";
import type { OcrProvider } from "../providers/ocrProvider";
import type { ReferenceColor, ThreadType } from "../types";

export type CatalogContextValue = {
  ready: boolean;
  catalog: ReferenceColor[];
  threadTypes: ThreadType[];
  defaultCatalogFilter: CatalogFilter;
  sessionCatalogThreadTypeId: string | null;
  ocr: OcrProvider;
  searchCatalog(query: string): Promise<ReferenceColor[]>;
  setDefaultCatalogFilter(filter: CatalogFilter): Promise<void>;
  setSessionCatalogThreadTypeId(threadTypeId: string): Promise<void>;
  clearSessionCatalogThreadTypeId(): Promise<void>;
  getThreadTypeById(threadTypeId: string): ThreadType | null;
  getThreadTypeDisplayName(threadTypeId: string): string;
};

export const CatalogContext = createContext<CatalogContextValue | null>(null);

export function useCatalog(): CatalogContextValue {
  const value = useContext(CatalogContext);
  if (!value) {
    throw new Error("useCatalog must be used within NeedleMinderProvider.");
  }
  return value;
}
