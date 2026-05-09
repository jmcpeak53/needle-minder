import { applyCatalogFilter, type CatalogFilter } from "../catalog/catalogFilter";
import type { InventoryItem, ReferenceColor } from "../types";

export function buildVisibleProjectThreadColors(input: {
  catalog: ReferenceColor[];
  inventory: InventoryItem[];
  reservedColorIds: Set<string>;
  query: string;
  filter: CatalogFilter;
}): ReferenceColor[] {
  const filteredCatalog = applyCatalogFilter(input.catalog, input.filter);
  const query = input.query.trim().toLowerCase();

  if (query) {
    return filteredCatalog
      .filter(
        (color) =>
          color.colorCode.toLowerCase().includes(query) ||
          color.colorName.toLowerCase().includes(query) ||
          color.colorFamily.toLowerCase().includes(query)
      )
      .slice(0, 80);
  }

  const stashIds = new Set(input.inventory.map((item) => item.referenceColor.id));
  return filteredCatalog
    .filter((color) => stashIds.has(color.id) || input.reservedColorIds.has(color.id))
    .slice(0, 80);
}
