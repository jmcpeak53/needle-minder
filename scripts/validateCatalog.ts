import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { validateReferenceColors } from "../src/catalog/catalogValidation";

const [, , ...paths] = process.argv;
const csvPaths = paths.length > 0 ? paths : defaultReferenceCatalogPaths();
let hasErrors = false;

for (const filePath of csvPaths) {
  const rows = parseCsv(readFileSync(filePath, "utf8"));
  const result = validateReferenceColors(rows);

  if (!result.ok) {
    hasErrors = true;
    console.error(`Invalid catalog: ${filePath}`);
    console.error(result.errors.join("\n"));
    continue;
  }

  console.log(`Catalog valid: ${filePath} (${result.colors.length} colors)`);
}

if (hasErrors) {
  process.exit(1);
}

function parseCsv(contents: string): Record<string, string>[] {
  const [headerLine, ...lines] = contents.trim().split(/\r?\n/);
  const headers = headerLine.split(",").map((header) => header.trim());

  return lines.map((line) => {
    const values = line.split(",");
    return Object.fromEntries(headers.map((header, index) => [header, values[index]?.trim() ?? ""]));
  });
}

function defaultReferenceCatalogPaths(): string[] {
  const referenceDir = join(__dirname, "..", "data", "reference");
  return readdirSync(referenceDir)
    .filter((name) => name.endsWith(".csv"))
    .map((name) => join(referenceDir, name));
}
