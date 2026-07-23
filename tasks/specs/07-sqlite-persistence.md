# Spec: Task 7 — SQLite Persistence Layer

## Objective

Persist full session state to SQLite using EF Core with proper relational
tables. Every mutation survives backend restarts. No voter↔vote linkage
possible anywhere in the database schema. Write-before-broadcast enforced
structurally. On startup, all sessions reload to exact prior state.

## Assumptions

1. **EF Core with SQLite provider** — proper relational mapping, type-safe
   queries, conventional .NET persistence.
2. Port interface (`ISessionRepository`) in `Domain/Ports/` (mirrors
   frontend convention: `src/domain/ports/`).
3. Adapter (`SqliteSessionRepository`) + EF `DbContext` + entity classes
   in Adapters assembly — Domain stays pure, no EF Core references.
4. **Proper SQL tables** — one table per concern, no "god tables". Session
   table holds only identity + phase + timestamps. Quiz state, presentation
   state, and voting state each get their own table.
5. Anonymity enforced at table level: vote tallies table has no participant
   column; voted-participants table has no vote/value column. No possible
   join between voter and votes.
6. "Write-before-broadcast" enforcement: Application-layer
   `SessionCommandHandler` wraps mutation → persist → broadcast as one
   atomic operation. Broadcast hook (no-op until Task 9/SignalR) runs only
   after successful persist. Lives in Application (not Domain) because it
   orchestrates domain mutation + persistence — a cross-cutting concern
   that Domain must not know about.
7. Multiple sessions in parallel — each session is a single-writer
   aggregate; different sessions write independently.
8. `DATA_DIR` environment variable controls DB file location.
9. **No migration framework.** Schema created via `EnsureCreated()`. During
   development, drop and recreate DB on schema changes. Project is
   build-once, no post-launch schema evolution needed.

## Table Schema

```
sessions
├── identity  TEXT PK
├── current_phase  INTEGER NOT NULL
└── created_at  TEXT NOT NULL

quiz_state  (1:1 with session)
├── session_identity  TEXT PK FK → sessions
├── current_question_index  INTEGER NULL
├── is_revealed  INTEGER NOT NULL DEFAULT 0
└── is_learning_text_shown  INTEGER NOT NULL DEFAULT 0

presentation_state  (1:1 with session)
├── session_identity  TEXT PK FK → sessions
├── presenting_group_name  TEXT NULL
└── presented_value_id  TEXT NULL

voting_state  (1:1 with session)
├── session_identity  TEXT PK FK → sessions
├── round_open  INTEGER NOT NULL DEFAULT 0
└── round_number  INTEGER NOT NULL DEFAULT 0

participants
├── id  TEXT PK
├── session_identity  TEXT FK → sessions
└── (roster membership)

quiz_answers
├── session_identity  TEXT FK → sessions
├── question_index  INTEGER
├── participant_id  TEXT FK → participants
├── answer_index  INTEGER NOT NULL
└── PK(session_identity, question_index, participant_id)

value_selections
├── session_identity  TEXT FK → sessions
├── participant_id  TEXT FK → participants
├── value_id  TEXT
└── PK(session_identity, participant_id, value_id)

selection_submissions  (tracks who submitted, not what)
├── session_identity  TEXT FK → sessions
├── participant_id  TEXT FK → participants
└── PK(session_identity, participant_id)

top_values
├── session_identity  TEXT FK → sessions
├── value_id  TEXT
└── PK(session_identity, value_id)

groups
├── id  INTEGER PK AUTOINCREMENT
├── session_identity  TEXT FK → sessions
├── name  TEXT NOT NULL
├── scribe_participant_id  TEXT NULL FK → participants
└── is_submitted  INTEGER NOT NULL DEFAULT 0

group_members
├── group_id  INTEGER FK → groups
├── participant_id  TEXT FK → participants
└── PK(group_id, participant_id)

group_assigned_values
├── group_id  INTEGER FK → groups
├── value_id  TEXT
└── PK(group_id, value_id)

group_actions
├── id  INTEGER PK AUTOINCREMENT
├── group_id  INTEGER FK → groups
├── value_id  TEXT NOT NULL
├── text  TEXT NOT NULL
└── sort_order  INTEGER NOT NULL

vote_tallies  ← NO participant column (anonymity)
├── session_identity  TEXT FK → sessions
├── round_number  INTEGER
├── value_id  TEXT
├── vote_count  INTEGER NOT NULL DEFAULT 0
└── PK(session_identity, round_number, value_id)

voted_participants  ← NO vote/value column (anonymity)
├── session_identity  TEXT FK → sessions
├── round_number  INTEGER
├── participant_id  TEXT FK → participants
└── PK(session_identity, round_number, participant_id)

winning_values
├── session_identity  TEXT FK → sessions
├── value_id  TEXT
├── rank  INTEGER NOT NULL
└── PK(session_identity, value_id)
```

**Anonymity argument:** `vote_tallies` contains (session, round, value,
count) — no participant. `voted_participants` contains (session, round,
participant) — no value or count. No FK or column connects them. Even with
full DB access, voter↔vote linkage is impossible.

## Deliverables

### A. `design/persistence.md`

Design document covering:
- Full table schema (above)
- Write-before-broadcast flow diagram
- Recovery procedure (startup load)
- Schema-level anonymity argument
- EF Core entity mapping approach

### B. Domain port

`ISessionRepository` in `ValuesWorkshop.Domain/Ports/`:
- `SaveAsync(sessionIdentity, session)` — map domain → entities, persist
- `LoadAsync(sessionIdentity)` → `Session?` — load entities, map → domain
- `LoadAllAsync()` → all active sessions (needed for startup recovery:
  "on startup, all sessions reload to exact prior state")

### C. EF Core entities + DbContext (Adapters)

- Entity classes in `Adapters/Persistence/Entities/` — EF-friendly POCOs,
  separate from domain types. Navigation properties, no domain logic.
- `WorkshopDbContext` in `Adapters/Persistence/` — configures table
  mappings, keys, relationships via `OnModelCreating`.

### D. SQLite adapter

- `SqliteSessionRepository` in `Adapters/Persistence/` — implements
  `ISessionRepository`. Maps between domain objects and EF entities.
  Uses `DbContext` for all DB operations.

### E. Application command handler

- `SessionCommandHandler` in Application: mutate → persist → broadcast.
  Broadcast = no-op `IBroadcaster` interface until Task 9. Lives in
  Application because it orchestrates domain + persistence — Domain stays
  pure with no persistence knowledge.

### F. Tests

- **Adapter round-trip tests** (Adapters.Tests): save session → dispose
  context → new context → load → assert identical state. Cover each
  building block with non-trivial state.
- **Anonymity schema test**: inspect EF model metadata → assert
  `vote_tallies` has no participant column; `voted_participants` has no
  value/count column.

### G. Host wiring

- Register `DbContext`, `ISessionRepository` in DI.
- On startup: `EnsureCreated()` for schema, load sessions.
- Remove placeholder seed code from Program.cs.

## Tech Stack

- `Microsoft.EntityFrameworkCore.Sqlite` (new dependency)
- xUnit + Shouldly (existing)

## Commands

```
Build:  dotnet build backend/ValuesWorkshop.All.sln
Test:   dotnet test backend/ValuesWorkshop.Tests.slnf
Lint:   ./scripts/ci-lint.sh
```

## Project Structure (new/changed files)

```
backend/Domain/Ports/ISessionRepository.cs                  → port interface
backend/Adapters/Persistence/WorkshopDbContext.cs            → EF DbContext
backend/Adapters/Persistence/Entities/*.cs                   → EF entity classes
backend/Adapters/Persistence/SqliteSessionRepository.cs      → adapter
backend/Adapters/Persistence/DomainEntityMapper.cs           → domain ↔ entity mapping
backend/Application/SessionCommandHandler.cs                 → mutation orchestrator
backend/Application/IBroadcaster.cs                          → broadcast port (no-op)
backend/Host/Program.cs                                      → DI wiring, startup
backend/Adapters.Tests/SqliteSessionRepositoryTests.cs       → round-trip + anonymity
design/persistence.md                                        → design doc
```

## Code Style

Records for value objects and DTOs. Sealed classes for entities (EF
requires mutable properties). Full word names. C# PascalCase
types/properties/methods, camelCase locals/params.

## Testing Strategy

- **Round-trip tests** (Adapters.Tests): EF in-memory SQLite. Save domain
  session with various states → new DbContext → load → deep equality.
- **Anonymity test** (Adapters.Tests): inspect EF model metadata to prove
  no voter↔vote join path exists in schema.
- Coverage: all persistence mapping code covered by round-trip tests.

## Boundaries

- **Always:** persist before broadcast; run tests before push.
- **Ask first:** schema changes, adding dependencies beyond EF Core.
- **Never:** store voter↔vote links; add migration framework.

## Success Criteria

1. `design/persistence.md` complete with schema, flow, anonymity argument.
2. `dotnet test backend/ValuesWorkshop.Tests.slnf` — all round-trip and
   schema tests pass.
3. No voter↔vote linkage in DB schema (test-asserted via EF metadata).
4. `SessionCommandHandler` enforces persist-before-broadcast.
5. `./scripts/ci-lint.sh` and `./scripts/ci-test.sh` pass.

## Open Questions

None.

---

## Implementation Steps

### Step 1: `design/persistence.md`
Write design doc with schema, flow, anonymity argument. Commit.

### Step 2: EF Core setup + entities + DbContext
Add EF Core SQLite package. Create entity classes and DbContext with full
table configuration. Commit.

### Step 3: Port interface + adapter
Add `ISessionRepository` to `Domain/Ports/`. Implement
`SqliteSessionRepository` with domain ↔ entity mapping. Write round-trip +
anonymity tests. Commit.

### Step 4: Application command handler
Add `IBroadcaster` and `SessionCommandHandler`. Commit.

### Step 5: Host wiring + cleanup
Wire DI. EnsureCreated on startup. Remove placeholder seed. Commit.

### Step 6: Quality gates
Run `ci-lint.sh` + `ci-test.sh`. Fix any issues. Final commit.
