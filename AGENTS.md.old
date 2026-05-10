# AGENTS.md — Needle Minder

This file is read at the start of every session in this repository. Treat it as standing instructions.

## Working Norms

- Plain-English explanations preferred over jargon. The product owner is a systems analyst, not a working developer.
- When two reasonable approaches exist, name both, recommend one, and explain what is being traded.
- Stop and ask when a decision has long-term consequences and is not covered here or in the current task brief.
- Honest assessments over agreement. If a request is a bad idea, say so.

## Coding Standards

Follow SOLID principles. Brief working interpretation for this codebase:

1. **Single Responsibility** — Each module, component, and function does one thing. UI screens render and dispatch user actions; data access lives in repository modules; business logic lives in services. Do not mix concerns inside a single file.

2. **Open/Closed** — Code is extensible without modification. The data model is designed to support multiple thread types and manufacturers in the future; adding a type should mean extending schema and reference data, not rewriting existing code paths.

3. **Liskov Substitution** — Implementations behind a common interface must be interchangeable. If two OCR providers exist, either should be usable without callers needing to know which is active.

4. **Interface Segregation** — Prefer narrow, purpose-specific interfaces over broad ones. A component that only reads inventory should not depend on a module that also writes it.

5. **Dependency Inversion** — High-level code depends on abstractions, not concrete implementations. UI consumes data through repositories; repositories consume storage through an abstraction over SQLite, never raw SQLite calls inside components.

Additional style guidance:

- Prefer composition over inheritance.
- Pure functions for transformations. Side effects (DB writes, camera access, navigation) live in clearly named functions or hooks.
- Avoid deep prop drilling — use context or composition where appropriate.
- Structure code so business logic can be unit tested without launching a device.

## External Tool Use — `llm-caller`

This environment provides an `llm-caller` tool family for delegating subtasks to other language models. Use it when it improves the work; do not use it as a default.

- **`llm-caller-ask` (MCP)** — Use to get a second opinion on an architectural decision, sanity-check unfamiliar API behavior, or work through a trade-off where a fresh perspective adds value. Provide enough context that the responder can answer without your session state.

- **`llm-caller read` (CLI)** — Use to read or summarize a file that is too large or repetitive to load into context fully (long logs, generated datasets, third-party reference documents). Prefer this over reading the file directly when only a summary or targeted extraction is needed.

- **`llm-caller` (CLI)** — Use for general one-shot LLM invocations from the shell when neither of the above fits, such as generating boilerplate, reformatting data, or producing alternative phrasings.

Do not use `llm-caller` to bypass product decisions or as a substitute for asking the product owner. If a question requires product-level judgment, ask in chat instead.

## Git Issues — Permission and Use

You have **explicit permission** to create issues in this repository using `gh issue create`. You should always create an issue to log your work whenever you make a change. You do not need to ask before doing so when the criteria below are met.

Create an issue when:

- **Scope creep is identified.** A request or finding that is out of v1 scope but worth remembering for later. Label it `scope-deferred`.
- **A defect is found but not immediately fixed.** Especially during exploratory work where fixing would derail the current task. Label it `defect`.
- **A decision is made under uncertainty that should be revisited.** Architectural compromises, library choices made on limited information, anything with a "we'll see if this holds up" character. Label it `tech-debt` or `revisit`.
- **An external assumption needs verification.** OCR accuracy expectations, dataset completeness, library API stability. Label it `verify`.

Do not create an issue for:

- Something you can fix in the current task without expanding scope.
- Internal reasoning notes — those belong in code comments or planning docs.
- Questions that need product-owner input — ask in chat instead of filing them.

Each issue must have a clear title, a description that is understandable a month from now without prior context, and an appropriate label.

Any time that you have completed an issue, comment on the issue so that the operator understand it is safe to close.

## README.md Maintenance

`README.md` is the canonical entry point for anyone opening this repo cold, including the product owner returning to it after a break. Keep it accurate.

Update `README.md` when:

- Setup or build steps change (new dependencies, env vars, commands).
- Project structure changes meaningfully (new top-level directory, significant relocation).
- The v1 feature set changes (features added, removed, or moved between phases).
- A command shown in the README is no longer correct.

Keep the README scoped to: what the app is, how to set up the dev environment, how to run it, how to run tests, and where to find deeper documentation. Do not let it become a feature spec or a planning doc.

If a README change is non-trivial, mention it explicitly in your task summary so it can be reviewed.
