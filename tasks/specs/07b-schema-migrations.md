# Task 7b — EF Core migrations

## Why

Checkpoint B failed on a live stack: `table presentation_state has no column
named shown_value_count`. `EnsureCreated()` (Task 7 decision,
`design/persistence.md:13`) creates a schema once and never evolves it, so
every schema change from Tasks 13–24 breaks any existing database — dev volume
or deployment — with a runtime error instead of a migration. This reverses that
decision.

## Scope

1. EF Core Migrations replace `EnsureCreated()`; the host applies pending
   migrations at startup.
2. An initial migration reproduces today's schema exactly (all tables from
   `design/persistence.md`, including `shown_value_count`).
3. A drift guard test fails the build when the model has changes not captured
   in a migration.
4. Tests build their databases through migrations, not `EnsureCreated`, so the
   suite exercises the same schema path production uses.
5. `design/persistence.md` updated: migrations replace the delete-the-file
   policy.

## Out of scope

Data migrations of existing rows beyond what the schema change needs; no
multi-database support; SQLite stays the store.

## Acceptance criteria

- [ ] A database created before `shown_value_count` existed is migrated on
      startup and serves sessions (reproduces the Checkpoint B failure, then
      passes)
- [ ] Model change without a migration fails the build via the drift guard
- [ ] Round-trip and restart suites green against a migrated database
- [ ] `design/persistence.md` documents the migration workflow

## Slices

1. Enable migrations + initial migration matching current schema
2. Apply at startup; delete `EnsureCreated`; tests use migrations
3. Drift guard test + docs
