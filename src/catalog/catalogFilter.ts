import type { ReferenceColor, ThreadType } from "../types";

export type CatalogFilter = "all" | string;

export type CatalogFilterOption = {
  value: CatalogFilter;
  label: string;
  manufacturer?: string;
  productLine?: string;
};

export function applyCatalogFilter(colors: ReferenceColor[], filter: CatalogFilter): ReferenceColor[] {
  if (filter === "all") {
    return colors;
  }

  return colors.filter((color) => color.threadTypeId === filter);
}

export function buildCatalogFilterOptions(threadTypes: ThreadType[]): CatalogFilterOption[] {
  return [
    {
      value: "all",
      label: "All catalogs"
    },
    ...threadTypes.map((threadType) => ({
      value: threadType.id,
      label: threadType.displayName,
      manufacturer: threadType.manufacturer,
      productLine: threadType.productLine
    }))
  ];
}

export function formatCatalogFilterLabel(filter: CatalogFilter, threadTypes: ThreadType[]): string {
  if (filter === "all") {
    return "All catalogs";
  }

  const threadType = threadTypes.find((item) => item.id === filter);
  return threadType?.displayName ?? "All catalogs";
}

export function normalizeCatalogFilter(filter: CatalogFilter | null | undefined, threadTypes: ThreadType[]): CatalogFilter {
  if (!filter || filter === "all") {
    return "all";
  }

  return threadTypes.some((threadType) => threadType.id === filter) ? filter : "all";
}
