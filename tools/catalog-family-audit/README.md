# Catalog Family Audit

Local review tool for correcting `colorFamily` assignments in Needle Minder's DMC reference catalogs.

## Start The Audit UI

From repository root:

```powershell
npm.cmd run catalog:audit
```

The server prints a local URL such as `http://127.0.0.1:4173`.

## Workflow

1. Review rows in the browser.
2. Mark obvious keepers as `confirmed`.
3. Set `reviewedFamily` and mark rows as `changed` when you know the correct family.
4. Mark rows as `needs-research` when they still require DMC lookup.
5. Use **Apply Reviewed Changes** after the queue is ready.

Review state is stored at:

- `data/import/catalog-family-audit/review-state.json`

Apply output is written to:

- `data/import/catalog-family-audit/last-apply-report.json`

## Apply From The CLI

If you prefer not to use the browser button:

```powershell
npm.cmd run catalog:audit:apply
```

That command patches `data/reference/*.csv` and regenerates both TypeScript fixture files.
