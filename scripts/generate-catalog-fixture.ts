/**
 * Generates fixture modules from reference CSVs.
 *
 * Usage:
 *   npx tsx scripts/generate-catalog-fixture.ts --catalog dmc-six-strand
 *   npx tsx scripts/generate-catalog-fixture.ts --catalog dmc-pearl-cotton-5
 */

import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import { validateReferenceColors } from "../src/catalog/catalogValidation";

type CatalogMeta = {
  id: string;
  csvPath: string;
  outPath: string;
  threadTypeConst: string;
  colorsConst: string;
  manufacturer: string;
  productLine: string;
  displayName: string;
};

const catalogMap: Record<string, CatalogMeta> = {
  "dmc-six-strand": {
    id: "dmc-six-strand",
    csvPath: join(__dirname, "..", "data", "reference", "dmc-six-strand.csv"),
    outPath: join(__dirname, "..", "src", "data", "referenceColors.fixture.ts"),
    threadTypeConst: "dmcSixStrandThreadType",
    colorsConst: "referenceColorFixture",
    manufacturer: "DMC",
    productLine: "Six-Strand Embroidery Floss",
    displayName: "DMC Six-Strand Embroidery Floss"
  },
  "dmc-pearl-cotton-5": {
    id: "dmc-pearl-cotton-5",
    csvPath: join(__dirname, "..", "data", "reference", "dmc-pearl-cotton-5.csv"),
    outPath: join(__dirname, "..", "src", "data", "pearlCotton5.fixture.ts"),
    threadTypeConst: "dmcPearlCotton5ThreadType",
    colorsConst: "pearlCotton5ReferenceColorFixture",
    manufacturer: "DMC",
    productLine: "Pearl Cotton Size 5",
    displayName: "DMC Pearl Cotton Size 5"
  }
};

function parseCsv(contents: string): Record<string, string>[] {
  const [headerLine, ...lines] = contents.trim().split(/\r?\n/);
  const headers = headerLine.split(",").map((h) => h.trim());
  return lines.map((line) => {
    const values = line.split(",");
    return Object.fromEntries(headers.map((h, i) => [h, values[i]?.trim() ?? ""]));
  });
}

function escapeString(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

function toId(catalogId: string, colorCode: string): string {
  return `${catalogId}-${colorCode.toLowerCase()}`;
}

function resolveCatalogId(argv: string[]): string {
  const index = argv.indexOf("--catalog");
  if (index === -1 || !argv[index + 1]) {
    return "dmc-six-strand";
  }
  return argv[index + 1];
}

function main(): void {
  const catalogId = resolveCatalogId(process.argv);
  const meta = catalogMap[catalogId];

  if (!meta) {
    const validIds = Object.keys(catalogMap).join(", ");
    console.error(`Unknown catalog '${catalogId}'. Valid values: ${validIds}`);
    process.exit(1);
  }

  const csv = readFileSync(meta.csvPath, "utf8");
  const rows = parseCsv(csv);
  const result = validateReferenceColors(rows);

  if (!result.ok) {
    console.error("CSV validation failed:");
    result.errors.forEach((error) => console.error(" ", error));
    process.exit(1);
  }

  const lines: string[] = [
    `import type { ReferenceColor, ThreadType } from "../types";`,
    ``,
    `export const ${meta.threadTypeConst}: ThreadType = {`,
    `  id: "${meta.id}",`,
    `  manufacturer: "${meta.manufacturer}",`,
    `  productLine: "${meta.productLine}",`,
    `  displayName: "${meta.displayName}",`,
    `  isActive: true`,
    `};`,
    ``,
    `export const ${meta.colorsConst}: ReferenceColor[] = [`
  ];

  for (let index = 0; index < result.colors.length; index += 1) {
    const color = result.colors[index];
    const isLast = index === result.colors.length - 1;

    lines.push(`  {`);
    lines.push(`    id: "${toId(meta.id, color.colorCode)}",`);
    lines.push(`    threadTypeId: ${meta.threadTypeConst}.id,`);
    lines.push(`    colorCode: "${escapeString(color.colorCode)}",`);
    lines.push(`    colorName: "${escapeString(color.colorName)}",`);
    lines.push(`    colorFamily: "${escapeString(color.colorFamily)}",`);
    lines.push(`    hexRgb: "${color.hexRgb}",`);
    lines.push(`    isVariegated: ${color.isVariegated},`);
    lines.push(`    threadSubtype: "${color.threadSubtype}",`);
    lines.push(`    upc: ${color.upc ? `"${escapeString(color.upc)}"` : "null"}`);
    lines.push(`  }${isLast ? "" : ","}`);
  }

  lines.push(`];`);
  lines.push(``);

  writeFileSync(meta.outPath, lines.join("\n"), "utf8");
  console.log(`Wrote ${result.colors.length} entries to ${meta.outPath}`);
}

main();
