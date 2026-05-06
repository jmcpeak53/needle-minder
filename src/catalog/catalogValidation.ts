import type { ReferenceColor } from "../types";

export type ReferenceColorCsvRow = {
  colorCode?: string;
  colorName?: string;
  colorFamily?: string;
  hexRgb?: string;
  isVariegated?: string | boolean;
  upc?: string | null;
};

type ValidCatalog = {
  ok: true;
  colors: (Omit<ReferenceColor, "id" | "threadTypeId" | "upc"> & { upc?: string | null })[];
  errors: [];
};

type InvalidCatalog = {
  ok: false;
  colors: [];
  errors: string[];
};

const hexPattern = /^#[0-9A-F]{6}$/;

export function validateReferenceColors(rows: ReferenceColorCsvRow[]): ValidCatalog | InvalidCatalog {
  const errors: string[] = [];
  const seenCodes = new Set<string>();
  const colors: ValidCatalog["colors"] = [];

  rows.forEach((row, index) => {
    const rowNumber = index + 1;
    const colorCode = normalizeText(row.colorCode).toUpperCase();
    const colorName = normalizeText(row.colorName);
    const colorFamily = normalizeText(row.colorFamily);
    const hexRgb = normalizeText(row.hexRgb).toUpperCase();
    const variegated = parseBoolean(row.isVariegated);

    if (!colorCode) {
      errors.push(`Row ${rowNumber}: colorCode is required.`);
    } else if (seenCodes.has(colorCode)) {
      errors.push(`Row ${rowNumber}: duplicate color code ${colorCode}.`);
    }

    if (!colorName) {
      errors.push(`Row ${rowNumber}: colorName is required.`);
    }

    if (!colorFamily) {
      errors.push(`Row ${rowNumber}: colorFamily is required.`);
    }

    if (!hexPattern.test(hexRgb)) {
      errors.push(`Row ${rowNumber}: hexRgb must be a 6-digit hex color like #C72B3B.`);
    }

    if (variegated === null) {
      errors.push(`Row ${rowNumber}: isVariegated must be true or false.`);
    }

    if (colorCode) {
      seenCodes.add(colorCode);
    }

    if (colorCode && colorName && colorFamily && hexPattern.test(hexRgb) && variegated !== null) {
      const validColor = {
        colorCode,
        colorName,
        colorFamily,
        hexRgb,
        isVariegated: variegated
      };
      const upc = normalizeOptionalText(row.upc);

      colors.push(upc ? { ...validColor, upc } : validColor);
    }
  });

  if (errors.length > 0) {
    return { ok: false, colors: [], errors };
  }

  return { ok: true, colors, errors: [] };
}

function normalizeText(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeOptionalText(value: unknown): string | null {
  const normalized = normalizeText(value);
  return normalized.length > 0 ? normalized : null;
}

function parseBoolean(value: unknown): boolean | null {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim().toLowerCase();
  if (normalized === "true") {
    return true;
  }

  if (normalized === "false") {
    return false;
  }

  return null;
}
