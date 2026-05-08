# Database Schema Reference

## Overview

Needle Minder uses a local SQLite database via `expo-sqlite`. The schema is
initialized on first app open inside `openNeedleMinderDatabase()` in
`src/db/database.ts`. Migrations run every launch but are idempotent —
`CREATE TABLE IF NOT EXISTS` for new installs; `ALTER TABLE` guards for
adding columns to existing device databases.

---

## Tables

### `thread_types`

Defines a manufacturer's product line. A single row exists for the initial
release: **DMC Six-Strand Embroidery Floss**.

| Column | Type | Notes |
|--------|------|-------|
| `id` | TEXT PK | Slug, e.g. `dmc-six-strand` |
| `manufacturer` | TEXT NOT NULL | e.g. `DMC` |
| `product_line` | TEXT NOT NULL | e.g. `Six-Strand Embroidery Floss` |
| `display_name` | TEXT NOT NULL | Human-readable label shown in the UI |
| `is_active` | INTEGER (bool) | 1 = active; set to 0 to hide a line without deleting |
| `created_at` | TEXT | ISO 8601 timestamp |
| `updated_at` | TEXT | ISO 8601 timestamp |

---

### `reference_colors`

The full thread colour catalogue. Seeded from
`src/data/referenceColors.fixture.ts` using `INSERT OR IGNORE`, so the
fixture is the authoritative source at install time and existing rows are
never overwritten.

| Column | Type | Notes |
|--------|------|-------|
| `id` | TEXT PK | Slug: `dmc-{colorCode.toLowerCase()}`, e.g. `dmc-310` |
| `thread_type_id` | TEXT NOT NULL FK → `thread_types.id` | Which product line this colour belongs to |
| `color_code` | TEXT NOT NULL | Uppercase. e.g. `310`, `B5200`, `E310`, `4010` |
| `color_name` | TEXT NOT NULL | e.g. `Black`, `Variegated - Garnet`, `Metallic - Ebony` |
| `color_family` | TEXT NOT NULL | Broad colour group for filtering (see below) |
| `hex_rgb` | TEXT NOT NULL | `#RRGGBB` uppercase, e.g. `#000000`. For variegated/Variations threads this is a representative dominant colour, not a precise value. |
| `is_variegated` | INTEGER (bool) | 1 when `thread_subtype` is `variegated`; mirrors `thread_subtype` for backward compatibility |
| `thread_subtype` | TEXT NOT NULL | One of `solid`, `variegated`, `metallic` — see reference table below |
| `upc` | TEXT (nullable) | Barcode for direct scan lookup; `NULL` when unknown |
| `created_at` | TEXT | ISO 8601 timestamp |
| `updated_at` | TEXT | ISO 8601 timestamp |

**Unique constraint:** `(thread_type_id, color_code)` — prevents duplicate
colour codes within a product line.

#### `thread_subtype` values

| Value | Description | Examples |
|-------|-------------|---------|
| `solid` | Standard solid-colour six-strand floss — the primary DMC product line. ~483 entries. | `310` Black, `321` Red, `B5200` Snow White |
| `variegated` | Multi-colour dyed threads. Includes classic variegated (2-digit codes 48–125) and DMC Color Variations (4000-series). ~54 entries. | `115` Variegated - Garnet, `4010` Variations - Winter Sky |
| `metallic` | DMC Metallic Embroidery Floss (E-prefix) and Metallic Pearl (5282–5283). Hex represents the metallic foil colour tone. ~38 entries. | `E310` Metallic - Ebony, `5282` Metallic Pearl - Gold |

#### `color_family` values (current)

Broad groups used for browsing and search faceting. All `solid` threads use
one of the first 20 families; `variegated` and `metallic` threads use the
last three.

`Red` · `Pink` · `Lavender` · `Purple` · `Blue` · `Blue Green` · `Green` ·
`Yellow` · `Orange` · `Peach` · `Brown` · `Gray` · `Black and White` ·
`Variegated` · `Variations` · `Metallic`

---

### `user_inventory`

The user's personal thread stash. Each row tracks one skein condition
(full or partial) for one reference colour.

| Column | Type | Notes |
|--------|------|-------|
| `id` | TEXT PK | Generated: `{timestamp}-{randomHex}` |
| `reference_color_id` | TEXT NOT NULL FK → `reference_colors.id` | The colour being tracked |
| `quantity` | INTEGER NOT NULL | Skein count. CHECK `quantity > 0` — zero-quantity rows are deleted |
| `condition` | TEXT NOT NULL | `full` or `partial` (CHECK constraint) |
| `notes` | TEXT (nullable) | Free-text user notes |
| `created_at` | TEXT | ISO 8601 timestamp |
| `updated_at` | TEXT | ISO 8601 timestamp |

A colour can have at most one row per condition — the repository
`addOrUpdate` logic merges into the existing row rather than inserting a
duplicate.

---

## TypeScript ↔ DB Column Mapping

| TypeScript (`ReferenceColor`) | DB column | Notes |
|-------------------------------|-----------|-------|
| `id` | `id` | |
| `threadTypeId` | `thread_type_id` | |
| `colorCode` | `color_code` | |
| `colorName` | `color_name` | |
| `colorFamily` | `color_family` | |
| `hexRgb` | `hex_rgb` | |
| `isVariegated` | `is_variegated` | Stored as `0`/`1`; mapped to `boolean` in `mapReferenceColor` |
| `threadSubtype` | `thread_subtype` | Stored as TEXT; cast to `ThreadSubtype` union in `mapReferenceColor` |
| `upc` | `upc` | `null` when absent |

| TypeScript (`InventoryItem`) | DB column | Notes |
|------------------------------|-----------|-------|
| `id` | `id` | |
| `referenceColor` | (joined) | Full `ReferenceColor` object joined from `reference_colors` |
| `quantity` | `quantity` | |
| `condition` | `condition` | `"full" \| "partial"` |
| `notes` | `notes` | |
| `updatedAt` | `updated_at` | |

---

## Seeding

Reference data is compiled into the app as a TypeScript fixture
(`src/data/referenceColors.fixture.ts`). On every app launch
`openNeedleMinderDatabase()` runs `seedReferenceData()`, which issues
`INSERT OR IGNORE` for every entry in the fixture. This is idempotent —
rows already in the database are silently skipped; no user inventory is
ever overwritten.

The fixture is generated from the canonical CSV at
`data/reference/dmc-six-strand.csv` by running:

```bash
npx tsx scripts/generate-catalog-fixture.ts
```

Validate the CSV before regenerating:

```bash
npm run validate:catalog -- data/reference/dmc-six-strand.csv
```

---

## Extending the Catalogue

### Adding a new manufacturer or product line

1. Add a new `ThreadType` entry to the seed data in `src/db/database.ts` (or
   to a new fixture alongside `dmcSixStrandThreadType`).
2. Create a reference CSV in `data/reference/` following the same column
   format. Run `npm run validate:catalog` to verify it.
3. Extend the fixture generator or write a new one to produce a TypeScript
   fixture for the new thread type.
4. The `reference_colors` unique index is scoped to
   `(thread_type_id, color_code)`, so identical colour codes from different
   manufacturers do not conflict.

### Adding a new `thread_subtype` value

1. Add the new value to the `ThreadSubtype` union in `src/types.ts`.
2. Add it to `VALID_SUBTYPES` in `src/catalog/catalogValidation.ts`.
3. Update the Drizzle schema enum in `src/db/schema.ts`.
4. Add an `ALTER TABLE ... ADD` migration guard in `src/db/database.ts` if
   necessary.
