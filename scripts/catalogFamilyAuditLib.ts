import { spawnSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

export const AUDIT_OUTPUT_DIR = join(__dirname, "..", "data", "import", "catalog-family-audit");
export const REVIEW_STATE_PATH = join(AUDIT_OUTPUT_DIR, "review-state.json");
export const APPLY_REPORT_PATH = join(AUDIT_OUTPUT_DIR, "last-apply-report.json");

export const CATALOGS = [
  {
    id: "dmc-six-strand",
    label: "DMC Six-Strand Embroidery Floss",
    csvPath: join(__dirname, "..", "data", "reference", "dmc-six-strand.csv")
  },
  {
    id: "dmc-pearl-cotton-5",
    label: "DMC Pearl Cotton Size 5",
    csvPath: join(__dirname, "..", "data", "reference", "dmc-pearl-cotton-5.csv")
  }
] as const;

export type CatalogId = (typeof CATALOGS)[number]["id"];

export type CatalogRow = {
  catalogId: CatalogId;
  colorCode: string;
  colorName: string;
  colorFamily: string;
  hexRgb: string;
  isVariegated: boolean;
  threadSubtype: string;
  upc: string;
};

export type ReviewStatus = "unreviewed" | "confirmed" | "changed" | "needs-research";

export type ReviewRecord = {
  status: ReviewStatus;
  reviewedFamily: string;
  notes: string;
  updatedAt: string;
};

export type AuditRow = CatalogRow & {
  key: string;
  catalogLabel: string;
  suggestedFamily: string;
  likelyIncorrect: boolean;
  reasons: string[];
  sharedCodeFamilies: string[];
  review: ReviewRecord;
};

export type AuditDataset = {
  generatedAt: string;
  families: string[];
  rows: AuditRow[];
  totals: {
    total: number;
    likelyIncorrect: number;
    reviewed: number;
    changed: number;
    needsResearch: number;
  };
};

export type ApplyResult = {
  appliedAt: string;
  updatedRows: {
    key: string;
    catalogId: CatalogId;
    colorCode: string;
    fromFamily: string;
    toFamily: string;
  }[];
  skippedRows: string[];
};

type ReviewState = Record<string, ReviewRecord>;

const NAME_KEYWORDS: { family: string; terms: string[] }[] = [
  { family: "Yellow", terms: ["yellow", "lemon", "canary", "straw", "gold", "mustard"] },
  { family: "Orange", terms: ["orange", "pumpkin", "tangerine", "topaz"] },
  { family: "Peach", terms: ["peach", "apricot", "salmon", "melon", "shell pink", "shrimp", "coral"] },
  { family: "Brown", terms: ["brown", "beaver", "mocha", "cocoa", "hazelnut", "mahogany", "driftwood", "tan", "khaki"] },
  { family: "Gray", terms: ["gray", "grey", "pewter", "steel"] },
  { family: "Green", terms: ["green", "olive", "moss", "fern", "avocado", "jade", "chartreuse", "pistachio"] },
  { family: "Blue Green", terms: ["blue green", "aquamarine", "turquoise", "teal", "sea green", "seagreen"] },
  { family: "Blue", terms: ["blue", "delft", "wedgewood", "navy", "sapphire"] },
  { family: "Lavender", terms: ["lavender", "lilac"] },
  { family: "Purple", terms: ["purple", "violet", "plum", "amethyst", "mauve", "eggplant"] },
  { family: "Pink", terms: ["pink", "rose", "carnation", "fuchsia", "blush"] },
  { family: "Red", terms: ["red", "garnet", "cranberry", "raspberry", "ruby", "geranium", "alizarian"] },
  { family: "Black and White", terms: ["black", "white", "snow white", "winter white", "ecru", "off white"] },
  { family: "Variations", terms: ["variations"] },
  { family: "Variegated", terms: ["variegated"] },
  { family: "Metallic", terms: ["metallic", "pearl"] }
];

const HUE_BOUNDARIES = new Set([
  "Pink->Red",
  "Red->Pink",
  "Peach->Orange",
  "Orange->Peach",
  "Lavender->Purple",
  "Purple->Lavender",
  "Blue->Blue Green",
  "Blue Green->Blue",
  "Black and White->Gray",
  "Gray->Black and White"
]);

export function loadAuditDataset(): AuditDataset {
  const rows = loadCatalogRows();
  const reviews = loadReviewState();
  const sharedCodeFamilies = buildSharedCodeFamilies(rows);
  const families = Array.from(
    new Set([...rows.map((row) => row.colorFamily), ...Object.values(reviews).map((row) => row.reviewedFamily)])
  )
    .filter(Boolean)
    .sort((left, right) => left.localeCompare(right));

  const auditRows = rows
    .map((row) => buildAuditRow(row, reviews, sharedCodeFamilies))
    .sort((left, right) => {
      if (left.catalogLabel !== right.catalogLabel) {
        return left.catalogLabel.localeCompare(right.catalogLabel);
      }
      if (left.colorFamily !== right.colorFamily) {
        return left.colorFamily.localeCompare(right.colorFamily);
      }
      return left.colorCode.localeCompare(right.colorCode, undefined, { numeric: true, sensitivity: "base" });
    });

  return {
    generatedAt: new Date().toISOString(),
    families,
    rows: auditRows,
    totals: {
      total: auditRows.length,
      likelyIncorrect: auditRows.filter((row) => row.likelyIncorrect).length,
      reviewed: auditRows.filter((row) => row.review.status !== "unreviewed").length,
      changed: auditRows.filter((row) => row.review.status === "changed").length,
      needsResearch: auditRows.filter((row) => row.review.status === "needs-research").length
    }
  };
}

export function saveReview(
  key: string,
  record: Pick<ReviewRecord, "status" | "reviewedFamily" | "notes">
): ReviewRecord {
  const reviews = loadReviewState();
  const saved: ReviewRecord = {
    status: record.status,
    reviewedFamily: record.reviewedFamily.trim(),
    notes: record.notes.trim(),
    updatedAt: new Date().toISOString()
  };
  reviews[key] = saved;
  ensureDirectory(REVIEW_STATE_PATH);
  writeFileSync(REVIEW_STATE_PATH, `${JSON.stringify(reviews, null, 2)}\n`, "utf8");
  return saved;
}

export function applyReviewedFamilies(): ApplyResult {
  const reviews = loadReviewState();
  const rowsByCatalog = new Map<CatalogId, CatalogRow[]>();

  for (const row of loadCatalogRows()) {
    const catalogRows = rowsByCatalog.get(row.catalogId) ?? [];
    catalogRows.push(row);
    rowsByCatalog.set(row.catalogId, catalogRows);
  }

  const updatedRows: ApplyResult["updatedRows"] = [];
  const skippedRows: string[] = [];

  for (const catalog of CATALOGS) {
    const rows = rowsByCatalog.get(catalog.id) ?? [];
    let changed = false;

    for (const row of rows) {
      const key = toAuditKey(row.catalogId, row.colorCode);
      const review = reviews[key];
      if (!review || !review.reviewedFamily) {
        continue;
      }
      if (review.status !== "confirmed" && review.status !== "changed") {
        skippedRows.push(key);
        continue;
      }
      if (review.reviewedFamily === row.colorFamily) {
        continue;
      }

      updatedRows.push({
        key,
        catalogId: row.catalogId,
        colorCode: row.colorCode,
        fromFamily: row.colorFamily,
        toFamily: review.reviewedFamily
      });
      row.colorFamily = review.reviewedFamily;
      changed = true;
    }

    if (changed) {
      writeCatalogCsv(catalog.csvPath, rows);
    }
  }

  const result: ApplyResult = {
    appliedAt: new Date().toISOString(),
    updatedRows,
    skippedRows: Array.from(new Set(skippedRows)).sort()
  };

  ensureDirectory(APPLY_REPORT_PATH);
  writeFileSync(APPLY_REPORT_PATH, `${JSON.stringify(result, null, 2)}\n`, "utf8");
  return result;
}

export function regenerateCatalogFixtures(): void {
  runTsx(["scripts/generate-catalog-fixture.ts", "--catalog", "dmc-six-strand"]);
  runTsx(["scripts/generate-catalog-fixture.ts", "--catalog", "dmc-pearl-cotton-5"]);
}

export function validateReferenceCatalogs(): void {
  runTsx([
    "scripts/validateCatalog.ts",
    "data/reference/dmc-six-strand.csv",
    "data/reference/dmc-pearl-cotton-5.csv"
  ]);
}

export function toAuditKey(catalogId: CatalogId, colorCode: string): string {
  return `${catalogId}:${normalizeCode(colorCode)}`;
}

function buildAuditRow(
  row: CatalogRow,
  reviews: ReviewState,
  sharedFamilies: Map<string, Set<string>>
): AuditRow {
  const key = toAuditKey(row.catalogId, row.colorCode);
  const review = reviews[key] ?? {
    status: "unreviewed",
    reviewedFamily: "",
    notes: "",
    updatedAt: ""
  };

  const hueSuggestion = suggestFamilyFromHex(row);
  const nameSuggestion = suggestFamilyFromName(row.colorName);
  const relatedFamilies = Array.from(sharedFamilies.get(normalizeCode(row.colorCode)) ?? [])
    .filter((family) => family !== row.colorFamily)
    .sort((left, right) => left.localeCompare(right));

  const reasons: string[] = [];

  if (relatedFamilies.length > 0) {
    reasons.push(`Same DMC code is assigned to ${relatedFamilies.join(", ")} in another catalog.`);
  }
  if (nameSuggestion && nameSuggestion !== row.colorFamily) {
    reasons.push(`Name suggests ${nameSuggestion}.`);
  }
  if (hueSuggestion && hueSuggestion !== row.colorFamily) {
    reasons.push(`Hex swatch suggests ${hueSuggestion}.`);
  }

  const likelyIncorrect =
    relatedFamilies.length > 0 ||
    (nameSuggestion !== "" &&
      nameSuggestion !== row.colorFamily &&
      !HUE_BOUNDARIES.has(`${row.colorFamily}->${nameSuggestion}`)) ||
    (hueSuggestion !== "" &&
      hueSuggestion !== row.colorFamily &&
      !HUE_BOUNDARIES.has(`${row.colorFamily}->${hueSuggestion}`) &&
      row.threadSubtype === "solid");

  return {
    ...row,
    key,
    catalogLabel: CATALOGS.find((catalog) => catalog.id === row.catalogId)?.label ?? row.catalogId,
    suggestedFamily: nameSuggestion || hueSuggestion || row.colorFamily,
    likelyIncorrect,
    reasons,
    sharedCodeFamilies: relatedFamilies,
    review
  };
}

function buildSharedCodeFamilies(rows: CatalogRow[]): Map<string, Set<string>> {
  const map = new Map<string, Set<string>>();
  for (const row of rows) {
    const code = normalizeCode(row.colorCode);
    const list = map.get(code) ?? new Set<string>();
    list.add(row.colorFamily);
    map.set(code, list);
  }
  return map;
}

function loadCatalogRows(): CatalogRow[] {
  return CATALOGS.flatMap((catalog) => {
    const csv = readFileSync(catalog.csvPath, "utf8");
    const records = parseCsv(csv);
    return records.map((record) => ({
      catalogId: catalog.id,
      colorCode: (record.colorCode ?? "").trim(),
      colorName: (record.colorName ?? "").trim(),
      colorFamily: (record.colorFamily ?? "").trim(),
      hexRgb: (record.hexRgb ?? "").trim().toUpperCase(),
      isVariegated: ((record.isVariegated ?? "").trim().toLowerCase() || "false") === "true",
      threadSubtype: (record.threadSubtype ?? "").trim().toLowerCase() || "solid",
      upc: (record.upc ?? "").trim()
    }));
  });
}

function writeCatalogCsv(path: string, rows: CatalogRow[]): void {
  const records = rows.map((row) => ({
    colorCode: row.colorCode,
    colorName: row.colorName,
    colorFamily: row.colorFamily,
    hexRgb: row.hexRgb,
    isVariegated: row.isVariegated ? "true" : "false",
    threadSubtype: row.threadSubtype,
    upc: row.upc
  }));

  writeFileSync(path, serializeCsv(records), "utf8");
}

function loadReviewState(): ReviewState {
  try {
    return JSON.parse(readFileSync(REVIEW_STATE_PATH, "utf8")) as ReviewState;
  } catch {
    return {};
  }
}

function suggestFamilyFromName(colorName: string): string {
  const normalized = colorName.trim().toLowerCase();
  for (const rule of NAME_KEYWORDS) {
    if (rule.terms.some((term) => normalized.includes(term))) {
      return rule.family;
    }
  }
  return "";
}

function suggestFamilyFromHex(row: CatalogRow): string {
  if (row.threadSubtype === "metallic") {
    return "Metallic";
  }
  if (row.threadSubtype === "variegated") {
    return row.colorFamily === "Variations" ? "Variations" : "Variegated";
  }

  const [red, green, blue] = toRgb(row.hexRgb);
  const max = Math.max(red, green, blue);
  const min = Math.min(red, green, blue);
  const lightness = (max + min) / 2 / 255;
  const saturation = max === min ? 0 : (max - min) / (255 - Math.abs(max + min - 255));

  if (lightness < 0.08) {
    return "Black and White";
  }
  if (saturation < 0.12) {
    return lightness > 0.84 ? "Black and White" : "Gray";
  }

  const hue = hueFromRgb(red, green, blue);

  if (hue < 12 || hue >= 345) {
    return "Red";
  }
  if (hue < 45) {
    return "Orange";
  }
  if (hue < 70) {
    return "Yellow";
  }
  if (hue < 155) {
    return "Green";
  }
  if (hue < 190) {
    return "Blue Green";
  }
  if (hue < 255) {
    return "Blue";
  }
  if (hue < 285) {
    return "Purple";
  }
  if (hue < 325) {
    return lightness > 0.62 ? "Lavender" : "Purple";
  }
  return "Pink";
}

function normalizeCode(code: string): string {
  const trimmed = code.trim().toUpperCase();
  if (/^\d+$/.test(trimmed)) {
    return String(Number(trimmed));
  }
  return trimmed;
}

function toRgb(hexRgb: string): [number, number, number] {
  const value = hexRgb.replace("#", "");
  return [
    Number.parseInt(value.slice(0, 2), 16),
    Number.parseInt(value.slice(2, 4), 16),
    Number.parseInt(value.slice(4, 6), 16)
  ];
}

function hueFromRgb(red: number, green: number, blue: number): number {
  const r = red / 255;
  const g = green / 255;
  const b = blue / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;

  if (delta === 0) {
    return 0;
  }

  let hue = 0;
  if (max === r) {
    hue = ((g - b) / delta) % 6;
  } else if (max === g) {
    hue = (b - r) / delta + 2;
  } else {
    hue = (r - g) / delta + 4;
  }

  return (hue * 60 + 360) % 360;
}

function ensureDirectory(path: string): void {
  mkdirSync(dirname(path), { recursive: true });
}

function parseCsv(contents: string): Record<string, string>[] {
  const rows = parseCsvRows(contents);
  if (rows.length === 0) {
    return [];
  }

  const [headers, ...dataRows] = rows;
  return dataRows.map((values) =>
    Object.fromEntries(headers.map((header, index) => [header.trim(), (values[index] ?? "").trim()]))
  );
}

function parseCsvRows(contents: string): string[][] {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentValue = "";
  let insideQuotes = false;

  for (let index = 0; index < contents.length; index += 1) {
    const char = contents[index];
    const next = contents[index + 1];

    if (char === '"') {
      if (insideQuotes && next === '"') {
        currentValue += '"';
        index += 1;
      } else {
        insideQuotes = !insideQuotes;
      }
      continue;
    }

    if (char === "," && !insideQuotes) {
      currentRow.push(currentValue);
      currentValue = "";
      continue;
    }

    if ((char === "\n" || char === "\r") && !insideQuotes) {
      if (char === "\r" && next === "\n") {
        index += 1;
      }
      currentRow.push(currentValue);
      if (currentRow.some((value) => value.length > 0)) {
        rows.push(currentRow);
      }
      currentRow = [];
      currentValue = "";
      continue;
    }

    currentValue += char;
  }

  if (currentValue.length > 0 || currentRow.length > 0) {
    currentRow.push(currentValue);
    rows.push(currentRow);
  }

  return rows;
}

function serializeCsv(records: Record<string, string>[]): string {
  if (records.length === 0) {
    return "";
  }

  const headers = Object.keys(records[0]);
  const lines = [
    headers.join(","),
    ...records.map((record) => headers.map((header) => escapeCsvValue(record[header] ?? "")).join(","))
  ];
  return `${lines.join("\n")}\n`;
}

function escapeCsvValue(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function runTsx(args: string[]): void {
  const command = process.platform === "win32" ? "npx.cmd" : "npx";
  const result = spawnSync(command, ["tsx", ...args], {
    stdio: "inherit"
  });

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}
