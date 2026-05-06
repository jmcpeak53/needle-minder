import { readFileSync } from "node:fs";

import { validateReferenceColors } from "../src/catalog/catalogValidation";

const [, , filePath] = process.argv;

if (!filePath) {
  console.error("Usage: npm run validate:catalog -- data/reference/dmc-six-strand.csv");
  process.exit(1);
}

const rows = parseCsv(readFileSync(filePath, "utf8"));
const result = validateReferenceColors(rows);

if (!result.ok) {
  console.error(result.errors.join("\n"));
  process.exit(1);
}

console.log(`Catalog valid: ${result.colors.length} colors`);

function parseCsv(contents: string): Record<string, string>[] {
  const [headerLine, ...lines] = contents.trim().split(/\r?\n/);
  const headers = headerLine.split(",").map((header) => header.trim());

  return lines.map((line) => {
    const values = line.split(",");
    return Object.fromEntries(headers.map((header, index) => [header, values[index]?.trim() ?? ""]));
  });
}
