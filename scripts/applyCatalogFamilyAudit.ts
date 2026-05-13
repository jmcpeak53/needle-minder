import {
  APPLY_REPORT_PATH,
  applyReviewedFamilies,
  regenerateCatalogFixtures,
  validateReferenceCatalogs
} from "./catalogFamilyAuditLib";

function main(): void {
  const result = applyReviewedFamilies();

  console.log(`Applied ${result.updatedRows.length} reviewed family changes.`);
  if (result.updatedRows.length > 0) {
    for (const row of result.updatedRows) {
      console.log(`  ${row.catalogId} ${row.colorCode}: ${row.fromFamily} -> ${row.toFamily}`);
    }
  }

  if (result.skippedRows.length > 0) {
    console.log(`Skipped ${result.skippedRows.length} review rows that were not ready to apply.`);
  }

  regenerateCatalogFixtures();
  validateReferenceCatalogs();

  console.log(`Wrote apply report to ${APPLY_REPORT_PATH}`);
}

main();
