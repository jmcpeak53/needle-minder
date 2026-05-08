/**
 * Reads data/reference/dmc-six-strand.csv and regenerates
 * src/data/referenceColors.fixture.ts.
 *
 * Usage:
 *   npx tsx scripts/generate-catalog-fixture.ts
 */

import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import { validateReferenceColors } from "../src/catalog/catalogValidation";

const CSV_PATH = join(__dirname, "..", "data", "reference", "dmc-six-strand.csv");
const OUT_PATH = join(__dirname, "..", "src", "data", "referenceColors.fixture.ts");
const THREAD_TYPE_ID = "dmc-six-strand";

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

function toId(colorCode: string): string {
  return `dmc-${colorCode.toLowerCase()}`;
}

function main(): void {
  const csv = readFileSync(CSV_PATH, "utf8");
  const rows = parseCsv(csv);
  const result = validateReferenceColors(rows);

  if (!result.ok) {
    console.error("CSV validation failed:");
    result.errors.forEach((e) => console.error(" ", e));
    process.exit(1);
  }

  const lines: string[] = [
    `import type { ReferenceColor, ThreadType } from "../types";`,
    ``,
    `export const dmcSixStrandThreadType: ThreadType = {`,
    `  id: "${THREAD_TYPE_ID}",`,
    `  manufacturer: "DMC",`,
    `  productLine: "Six-Strand Embroidery Floss",`,
    `  displayName: "DMC Six-Strand Embroidery Floss",`,
    `  isActive: true`,
    `};`,
    ``,
    `export const referenceColorFixture: ReferenceColor[] = [`
  ];

  for (let i = 0; i < result.colors.length; i++) {
    const c = result.colors[i];
    const isLast = i === result.colors.length - 1;
    const upcLine =
      c.upc ? `    upc: "${escapeString(c.upc)}"` : `    upc: null`;

    lines.push(`  {`);
    lines.push(`    id: "${toId(c.colorCode)}",`);
    lines.push(`    threadTypeId: dmcSixStrandThreadType.id,`);
    lines.push(`    colorCode: "${escapeString(c.colorCode)}",`);
    lines.push(`    colorName: "${escapeString(c.colorName)}",`);
    lines.push(`    colorFamily: "${escapeString(c.colorFamily)}",`);
    lines.push(`    hexRgb: "${c.hexRgb}",`);
    lines.push(`    isVariegated: ${c.isVariegated},`);
    lines.push(`    threadSubtype: "${c.threadSubtype}",`);
    lines.push(upcLine);
    lines.push(`  }${isLast ? "" : ","}`);
  }

  lines.push(`];`);
  lines.push(``);

  writeFileSync(OUT_PATH, lines.join("\n"), "utf8");
  console.log(`Wrote ${result.colors.length} entries to ${OUT_PATH}`);
}

main();
