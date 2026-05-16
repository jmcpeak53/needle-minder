# Needle Minder — Agent Instructions

## Commands

| Command | What it does |
|---|---|
| `npm run dev` | Start Metro bundler with dev client (`npx expo start --dev-client --host lan`) |
| `npm test` | Run all Jest tests |
| `npm test -- --runInBand` | Run tests serially (avoid SQLite fixture race conditions) |
| `npm test -- __tests__/someFile.test.ts` | Run a single test file |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | ESLint (flat config) |
| `npm run validate:catalog` | Validate reference CSVs in `data/reference/` |
| `npm run validate:catalog -- data/reference/dmc-six-strand.csv` | Validate a single CSV file |

Don't run 'npm' directly, use 'npm.cmd' instead.

## Architecture

- **Entry point**: `expo-router/entry` (set in `package.json` `main`), layout at `app/_layout.tsx`
- **File-based routing** via Expo Router in `app/` — see `app/_layout.tsx` for all registered routes
- **Services wiring**: `src/state/composeServices.ts` opens SQLite DB, instantiates repositories and services, all consumed through React contexts (`CatalogContext`, `InventoryContext`, `ProjectsContext`, `BackupContext`)
- **Layers**: UI (contexts/screens) → services (business rules in `src/inventory/`, `src/projects/`) → repositories (data access interfaces in `src/catalog/`, `src/inventory/`, `src/settings/`) → SQLite implementations in `src/db/`
- **No Expo Go support** — ML Kit text recognition is native-only. Must use custom dev build (`npm run build:dev:android` / `npm run build:dev:ios`)
- **`@/`** path alias maps to `src/` (configured in `tsconfig.json`)

## Database

- `expo-sqlite` with raw SQL (Drizzle ORM is a dev dependency used only for TS schema types in `src/db/schema.ts`)
- Manual migration in `src/db/database.ts:migrate()` using `CREATE TABLE IF NOT EXISTS` + safe `ALTER TABLE` fallbacks
- Reference data seeded via `INSERT OR IGNORE` from `src/data/referenceCatalog.fixture.ts`
- Source CSVs live in `data/reference/` — validated by `scripts/validateCatalog.ts`
- ID generation: `Date.now() + random string` in `src/db/createId.ts`

## Conventions

- **UI code must not import `expo-sqlite` directly** — enforced by ESLint `no-restricted-imports` rule. Use repository modules from `src/db/`.
- Business logic should be unit-testable without a device (pure functions + interface-based repositories)
- Theme constants in `src/ui/theme.ts` — paper/ink palette, custom fonts (DM Sans, Instrument Serif, JetBrains Mono)
- The data model is designed for extensibility (multiple manufacturers, thread types, OCR providers). Add types/schema rather than rewrite code paths.

## External Tool Use — `llm-caller`

This environment provides an `llm-caller` tool family for delegating subtasks to other language models. Use it when it improves the work; do not use it as a default.
- **`llm-caller-ask` (MCP)** — Use to get a second opinion on an architectural decision, sanity-check unfamiliar API behavior, or work through a trade-off where a fresh perspective adds value. Provide enough context that the responder can answer without your session state.
- **`llm-caller read` (CLI)** — Use to read or summarize a file that is too large or repetitive to load into context fully (long logs, generated datasets, third-party reference documents). Prefer this over reading the file directly when only a summary or targeted extraction is needed.
- **`llm-caller` (CLI)** — Use for general one-shot LLM invocations from the shell when neither of the above fits, such as generating boilerplate, reformatting data, or producing alternative phrasings.
Do not use `llm-caller` to bypass product decisions or as a substitute for asking the product owner. If a question requires product-level judgment, ask in chat instead.

## llm-caller Sandbox Handling

When using `llm-ask` or `llm-write`, request elevated execution up front
with the narrow command prefix rule for that tool. These commands make
outbound model API calls and will fail inside the Windows sandbox with a
socket-permission error. Do not first run them sandboxed unless the task is
explicitly testing sandbox behavior.

- For `llm-ask`, use `sandbox_permissions="require_escalated"` and
  `prefix_rule=["llm-ask"]`.
- For `llm-write`, use `sandbox_permissions="require_escalated"` and
  `prefix_rule=["llm-write"]`.
- `llm-extract` is local-only and does not require escalation.

The persisted approval rules are intentionally narrow. Do not request broad
PowerShell, Python, or unrestricted network approval for llm-caller work.

## Testing

- Jest with `jest-expo` preset and `babel-jest` transform
- Repository interfaces can be mocked with `jest.fn()` factory functions (see `__tests__/inventoryService.test.ts` for pattern)
- No external services needed for unit tests

## Communication

- Product owner is a systems analyst, not a working developer — prefer plain English over jargon
- When two reasonable approaches exist, name both, recommend one, and explain the trade-off
- Stop and ask when a decision has long-term consequences and is not covered here or in the task brief
- Give honest assessments — if a request is a bad idea, say so

## Issue Tracking

Use `gh issue create` to log work. Create issues for:
- Scope creep outside v1 worth remembering (label: `scope-deferred`)
- Defects found but not immediately fixed (label: `defect`)
- Decisions made under uncertainty that should be revisited (label: `tech-debt` or `revisit`)
Each issue needs a clear title and enough context to be understood a month later.

When working an issue:
- Check for cross links where more than one issue could be worked in parallel without expanding the complexity of the work too much.
- Comment on the issue with a summary of the work you performed
- Create a branch for the issue, and publish via PR. You must publish the PR and set the status of the PR to "Ready for Review" so that the next step in the workflow can be taken.
- Do not merge to Main unless given explicit instructions to do

## README

Review the README.md as the first step of any prompt to ground yourself in the project.

Update `README.md` when setup steps, project structure, commands, or the v1 feature set changes. Keep it scoped to: what the app is, setup, running, testing, and where to find deeper docs.

## Notable

- `tools/thread-puller/` has a standalone Python tool for scraping/importing thread catalog CSVs
- Design docs, sample images, sample data, and `docs/` are gitignored
