# Database Schema Reference

## Overview

Needle Minder uses a local SQLite database via `expo-sqlite`. The schema is
initialized on first app open inside `openNeedleMinderDatabase()` in
`src/db/database.ts`. Migrations run every launch but are idempotent:
`CREATE TABLE IF NOT EXISTS` for new installs, plus targeted `ALTER TABLE`
guards for older device databases when needed.

## Tables

### `thread_types`

Defines a manufacturer's product line. A single row exists for the initial
release: **DMC Six-Strand Embroidery Floss**.

| Column | Type | Notes |
|---|---|---|
| `id` | TEXT PK | Slug, e.g. `dmc-six-strand` |
| `manufacturer` | TEXT NOT NULL | e.g. `DMC` |
| `product_line` | TEXT NOT NULL | e.g. `Six-Strand Embroidery Floss` |
| `display_name` | TEXT NOT NULL | Human-readable label shown in the UI |
| `is_active` | INTEGER (bool) | 1 = active; set to 0 to hide a line without deleting |
| `created_at` | TEXT | ISO 8601 timestamp |
| `updated_at` | TEXT | ISO 8601 timestamp |

### `reference_colors`

The full thread catalog. Seeded from `src/data/referenceColors.fixture.ts`
using `INSERT OR IGNORE`, so the fixture is the install-time source of truth
and existing rows are never overwritten.

| Column | Type | Notes |
|---|---|---|
| `id` | TEXT PK | Slug: `dmc-{colorCode.toLowerCase()}`, e.g. `dmc-310` |
| `thread_type_id` | TEXT NOT NULL FK -> `thread_types.id` | Which product line this color belongs to |
| `color_code` | TEXT NOT NULL | Uppercase, e.g. `310`, `B5200`, `E310`, `4010` |
| `color_name` | TEXT NOT NULL | e.g. `Black`, `Variegated - Garnet`, `Metallic - Ebony` |
| `color_family` | TEXT NOT NULL | Broad color group for filtering |
| `hex_rgb` | TEXT NOT NULL | `#RRGGBB` uppercase representative color |
| `is_variegated` | INTEGER (bool) | 1 when `thread_subtype` is `variegated`; kept for backward compatibility |
| `thread_subtype` | TEXT NOT NULL | One of `solid`, `variegated`, `metallic` |
| `upc` | TEXT (nullable) | Barcode for direct scan lookup; `NULL` when unknown |
| `created_at` | TEXT | ISO 8601 timestamp |
| `updated_at` | TEXT | ISO 8601 timestamp |

**Unique constraint:** `(thread_type_id, color_code)`

#### `thread_subtype` values

| Value | Description | Examples |
|---|---|---|
| `solid` | Standard solid-color six-strand floss | `310`, `321`, `B5200` |
| `variegated` | Multi-color dyed threads | `115`, `4010` |
| `metallic` | Metallic embroidery floss / pearl | `E310`, `5282` |

#### `color_family` values (current)

`Red`, `Pink`, `Lavender`, `Purple`, `Blue`, `Blue Green`, `Green`,
`Yellow`, `Orange`, `Peach`, `Brown`, `Gray`, `Black and White`,
`Variegated`, `Variations`, `Metallic`

### `user_inventory`

The user's physical stash. Each row tracks one skein condition for one
reference color.

| Column | Type | Notes |
|---|---|---|
| `id` | TEXT PK | Generated: `{timestamp}-{randomHex}` |
| `reference_color_id` | TEXT NOT NULL FK -> `reference_colors.id` | The color being tracked |
| `quantity` | INTEGER NOT NULL | Skein count; CHECK `quantity > 0` |
| `condition` | TEXT NOT NULL | `full` or `partial` |
| `notes` | TEXT (nullable) | Free-text user notes |
| `created_at` | TEXT | ISO 8601 timestamp |
| `updated_at` | TEXT | ISO 8601 timestamp |

A color can have at most one row per condition. The repository `addOrUpdate`
logic merges into the existing row rather than inserting a duplicate.

### `projects`

Saved project records used for planning and tracking reserved skeins.

| Column | Type | Notes |
|---|---|---|
| `id` | TEXT PK | Generated app-side |
| `folder` | TEXT (nullable) | Flat v1 folder label; `NULL` means Root |
| `name` | TEXT NOT NULL | Required project name |
| `author` | TEXT (nullable) | Designer / pattern source |
| `canvas_mesh` | INTEGER (nullable) | Reserved for future cloth or mesh support; current allowed values are `13`, `18`, or `NULL` |
| `status` | TEXT NOT NULL | `not_started`, `pattern`, `wip`, or `finished` |
| `start_date` | TEXT (nullable) | `YYYY-MM-DD` |
| `completed_date` | TEXT (nullable) | `YYYY-MM-DD`; cannot be before `start_date` |
| `image_uri` | TEXT (nullable) | Local URI for a captured project photo |
| `notes` | TEXT (nullable) | User notes; capped at 255 chars in the service layer |
| `created_at` | TEXT | ISO 8601 timestamp |
| `updated_at` | TEXT | ISO 8601 timestamp |

Business rules:

- When a project first enters `wip`, the service defaults `start_date` to today if absent.
- When a project first enters `finished`, the service defaults `completed_date` to today if absent.
- Finished projects are not reopenable in the current implementation because stash deduction is one-way.

### `project_thread_reservations`

Per-project skein planning rows. Reservations do **not** decrement physical
stash on their own.

| Column | Type | Notes |
|---|---|---|
| `id` | TEXT PK | Generated app-side |
| `project_id` | TEXT NOT NULL FK -> `projects.id` | Cascade deletes when a project is removed |
| `reference_color_id` | TEXT NOT NULL FK -> `reference_colors.id` | Reserved thread color |
| `quantity` | INTEGER NOT NULL | Whole skein count; must be `> 0` |
| `created_at` | TEXT | ISO 8601 timestamp |
| `updated_at` | TEXT | ISO 8601 timestamp |

**Unique constraint:** `(project_id, reference_color_id)`

Behavior notes:

- Active reservation math counts only `not_started`, `pattern`, and `wip` projects.
- Finished projects keep reservation rows as history, but their rows are excluded from active availability and shopping calculations.
- When a project is finished, its reserved skeins are deducted from `user_inventory`. Partial skeins are consumed before full skeins for the same color.

## TypeScript <-> DB Column Mapping

| TypeScript (`ReferenceColor`) | DB column | Notes |
|---|---|---|
| `id` | `id` | |
| `threadTypeId` | `thread_type_id` | |
| `colorCode` | `color_code` | |
| `colorName` | `color_name` | |
| `colorFamily` | `color_family` | |
| `hexRgb` | `hex_rgb` | |
| `isVariegated` | `is_variegated` | Stored as `0`/`1`; mapped to `boolean` in `mapReferenceColor` |
| `threadSubtype` | `thread_subtype` | Cast to `ThreadSubtype` in `mapReferenceColor` |
| `upc` | `upc` | `null` when absent |

| TypeScript (`InventoryItem`) | DB column | Notes |
|---|---|---|
| `id` | `id` | |
| `referenceColor` | (joined) | Full `ReferenceColor` object joined from `reference_colors` |
| `quantity` | `quantity` | |
| `condition` | `condition` | `"full" \| "partial"` |
| `notes` | `notes` | |
| `updatedAt` | `updated_at` | |

| TypeScript (`Project`) | DB column | Notes |
|---|---|---|
| `id` | `id` | |
| `folder` | `folder` | `null` means Root |
| `name` | `name` | |
| `author` | `author` | |
| `canvasMesh` | `canvas_mesh` | `13`, `18`, or `null` |
| `status` | `status` | `"not_started" \| "pattern" \| "wip" \| "finished"` |
| `startDate` | `start_date` | |
| `completedDate` | `completed_date` | |
| `imageUri` | `image_uri` | |
| `notes` | `notes` | |
| `createdAt` | `created_at` | |
| `updatedAt` | `updated_at` | |

| TypeScript (`ProjectReservation`) | DB column | Notes |
|---|---|---|
| `id` | `id` | |
| `projectId` | `project_id` | |
| `referenceColorId` | `reference_color_id` | |
| `quantity` | `quantity` | |
| `createdAt` | `created_at` | |
| `updatedAt` | `updated_at` | |

## Seeding

Reference data is compiled into the app as a TypeScript fixture
(`src/data/referenceColors.fixture.ts`). On every app launch
`openNeedleMinderDatabase()` runs `seedReferenceData()`, which issues
`INSERT OR IGNORE` for every entry in the fixture. This is idempotent: rows
already in the database are silently skipped, and no user inventory or
project data is overwritten.

The fixture is generated from the canonical CSV at
`data/reference/dmc-six-strand.csv` by running:

```bash
npx tsx scripts/generate-catalog-fixture.ts
```

Validate the CSV before regenerating:

```bash
npm run validate:catalog -- data/reference/dmc-six-strand.csv
```

## Extending the Catalog

### Adding a new manufacturer or product line

1. Add a new `ThreadType` seed entry in `src/db/database.ts` or a new fixture.
2. Create a reference CSV in `data/reference/` using the current column format.
3. Run `npm run validate:catalog` against the CSV.
4. Extend the fixture generator or add a new one to produce a TypeScript fixture.
5. The `reference_colors` unique index is scoped to `(thread_type_id, color_code)`, so identical color codes from different manufacturers do not conflict.

### Adding a new `thread_subtype` value

1. Add the new value to the `ThreadSubtype` union in `src/types.ts`.
2. Add it to `VALID_SUBTYPES` in `src/catalog/catalogValidation.ts`.
3. Update the Drizzle schema enum in `src/db/schema.ts`.
4. Add an `ALTER TABLE` migration guard in `src/db/database.ts` if needed.
