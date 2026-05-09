import { applyCatalogFilter, type CatalogFilter } from "./catalogFilter";
import type { ReferenceColor, ThreadType } from "../types";

export type CatalogBrowseInput = {
  catalog: ReferenceColor[];
  filter: CatalogFilter;
  query: string;
  selectedFamily: string | null;
};

export type CatalogFamilySummary = {
  name: string;
  count: number;
  representativeHex: string;
  isRainbow: boolean;
};

export function buildCatalogBrowseResults(input: CatalogBrowseInput): {
  filteredCatalog: ReferenceColor[];
  families: CatalogFamilySummary[];
  results: ReferenceColor[];
} {
  const filteredCatalog = applyCatalogFilter(input.catalog, input.filter);
  const families = buildCatalogFamilies(filteredCatalog);
  const query = input.query.trim().toLowerCase();

  let results: ReferenceColor[] = [];
  if (query) {
    results = filteredCatalog.filter(
      (color) =>
        color.colorCode.toLowerCase().includes(query) ||
        color.colorName.toLowerCase().includes(query) ||
        color.colorFamily.toLowerCase().includes(query)
    );
  } else if (input.selectedFamily) {
    results = filteredCatalog.filter((color) => color.colorFamily === input.selectedFamily);
  }

  return {
    filteredCatalog,
    families,
    results
  };
}

export function buildReferenceColorSubtitle(
  color: ReferenceColor,
  input: {
    filter: CatalogFilter;
    catalog: ReferenceColor[];
    threadTypes: ThreadType[];
  }
): string {
  const parts = [color.colorFamily];

  if (input.filter === "all" && hasDuplicateColorCode(color, input.catalog)) {
    const threadType = input.threadTypes.find((item) => item.id === color.threadTypeId);
    if (threadType) {
      parts.push(threadType.displayName);
    }
  }

  return parts.join(" · ");
}

function buildCatalogFamilies(colors: ReferenceColor[]): CatalogFamilySummary[] {
  const map = new Map<string, ReferenceColor[]>();
  for (const color of colors) {
    const list = map.get(color.colorFamily) ?? [];
    list.push(color);
    map.set(color.colorFamily, list);
  }

  return Array.from(map.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([name, members]) => {
      if (members.some((member) => member.threadSubtype === "metallic")) {
        return { name, count: members.length, representativeHex: "#C0BDBA", isRainbow: false };
      }

      if (
        members.every((member) => member.threadSubtype === "variegated") ||
        name.toLowerCase().includes("varieg")
      ) {
        return { name, count: members.length, representativeHex: "", isRainbow: true };
      }

      const nameLower = name.toLowerCase();
      let representative = members.find((member) => member.colorName.toLowerCase() === nameLower);
      if (!representative) {
        representative = members.find((member) => member.colorName.toLowerCase().startsWith(nameLower));
      }
      if (!representative) {
        representative = members[Math.floor(members.length / 2)];
      }

      return {
        name,
        count: members.length,
        representativeHex: representative.hexRgb,
        isRainbow: false
      };
    });
}

function hasDuplicateColorCode(color: ReferenceColor, catalog: ReferenceColor[]): boolean {
  return catalog.filter((item) => item.colorCode === color.colorCode).length > 1;
}
