# Thread Puller

Thread Puller is a standalone Python tool that scrapes thread catalog listings and produces a normalized CSV import for Needle Minder.

V1 scope in this repository is Penny Linn DMC Pearl Cotton Size 5.

## Quick Start

From repository root:

```powershell
cd tools/thread-puller
python -m venv .venv
.venv\Scripts\python -m pip install -e ".[dev]"
```

## Run

From repository root:

```powershell
tools\thread-puller\.venv\Scripts\thread-puller scrape --config tools/thread-puller/configs/dmc-pearl-cotton-5.yaml
tools\thread-puller\.venv\Scripts\thread-puller normalize --config tools/thread-puller/configs/dmc-pearl-cotton-5.yaml
tools\thread-puller\.venv\Scripts\thread-puller run --config tools/thread-puller/configs/dmc-pearl-cotton-5.yaml
```

## Outputs

Default config writes:

- `data/import/thread-puller/dmc-pearl-cotton-5/raw-products.jsonl`
- `data/import/thread-puller/dmc-pearl-cotton-5/normalized-listings.csv`
- `data/import/thread-puller/dmc-pearl-cotton-5/unmatched-codes.csv`
- `data/import/thread-puller/dmc-pearl-cotton-5/dedupe-report.csv`
- `data/reference/dmc-pearl-cotton-5.csv`

Normalization preserves existing reference CSV rows, appends only new scraped
codes that have canonical metadata, and records skipped duplicates or incomplete
records in the dedupe report.

## Validate App Catalog CSVs

After generation, validate catalog CSVs:

```powershell
npm run validate:catalog
```

Or validate explicit files:

```powershell
npm run validate:catalog -- data/reference/dmc-six-strand.csv data/reference/dmc-pearl-cotton-5.csv
```

## Tests

```powershell
tools\thread-puller\.venv\Scripts\python -m pytest tools/thread-puller/tests -q
```

## Extending Later

- Add new source config entries in `configs/*.yaml`.
- Keep canonical export keyed by normalized `colorCode`.
- Add new site-specific parser functions without changing core normalization/output contracts.
