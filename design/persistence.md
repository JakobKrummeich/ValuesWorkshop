# Persistence — ValuesWorkshop

Living document. Deviations discovered during implementation update this file
in the same PR (Ask-first).

---

## 1. Storage Technology

SQLite via EF Core (`Microsoft.EntityFrameworkCore.Sqlite`). Single file
database at `$DATA_DIR/valuesworkshop.db` (default `DATA_DIR=data`).

Schema evolution runs on EF Core Migrations. The migrations live in
`backend/Adapters.Persistence/Migrations/`, and the host applies every pending
one at startup (`WorkshopDatabaseSchema.ApplyAsync`, called from
`Host/Program.cs`). Tests build their databases through the same call, so the
suite exercises the production schema path. Existing database files are
evolved in place — no file is ever deleted for a schema change.

### Adding a migration

1. Change the entity configuration.
2. `dotnet tool run dotnet-ef migrations add <Name> --project
   backend/Adapters.Persistence --startup-project backend/Adapters.Persistence`
   (`WorkshopDbContextDesignTimeFactory` supplies the design-time context, so
   the Host is not involved).
3. `dotnet csharpier format backend/` — the generated files ship formatted.
4. `dotnet test backend/ValuesWorkshop.Tests.slnf`.

A model change without a matching migration fails the build:
`MigrationsDriftTests` diffs the EF model against the migrations snapshot with
`IMigrationsModelDiffer` and names the offending table and column plus the
command that fixes it. Generated migration files are marked
`generated_code = true` in `backend/.editorconfig` and skipped by jscpd, so the
maintainability analyzers judge hand-written code only.

### Databases created before migrations existed

Files written by builds that used `EnsureCreated()` carry no
`__EFMigrationsHistory` table, so `Migrate()` alone would try to create tables
that are already there. `WorkshopDatabaseSchema` detects that shape (model
tables present, history table absent), adds every column the model has and the
file lacks (this is what repairs the `shown_value_count` failure that
reversed the Task 7 no-migration decision), and records the initial migration
as applied. Rows are kept. Later migrations then apply normally, and the
adoption step never runs again on that file. A file so old that it lacks a
whole table cannot be adopted — startup refuses it by name and asks for the
file to be deleted, rather than leaving a half-schema behind.

---

## 2. Table Schema

One table per concern — no "god tables". Session table holds only identity,
phase, and timestamp. Per-phase state gets its own table.

### Core

```sql
CREATE TABLE sessions (
    identity             TEXT    PRIMARY KEY,
    facilitator_subject  TEXT    NOT NULL,
    name                 TEXT    NOT NULL,
    current_phase        INTEGER NOT NULL,
    revision             INTEGER NOT NULL DEFAULT 0,
    is_formed            INTEGER NOT NULL DEFAULT 0,
    created_at           TEXT    NOT NULL
);
```

`facilitator_subject` is the OIDC `sub` recorded when `POST /api/sessions`
accepted the passphrase; it is the whole of the facilitator's identity, so
facilitator control survives a restart and a reopened tab without anything
being kept on the client (`design/protocol.md` § 2.1). `name` is the session
name the facilitator typed, persisted for consumers that arrive later.

### Per-phase state (1:1 with session)

```sql
CREATE TABLE quiz_state (
    session_identity         TEXT    PRIMARY KEY REFERENCES sessions(identity),
    current_question_index   INTEGER,
    is_revealed              INTEGER NOT NULL DEFAULT 0,
    is_learning_text_shown   INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE presentation_state (
    session_identity       TEXT    PRIMARY KEY REFERENCES sessions(identity),
    presenting_group_name  TEXT,
    presented_value_id     TEXT,
    shown_value_count      INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE voting_state (
    session_identity TEXT    PRIMARY KEY REFERENCES sessions(identity),
    round_open       INTEGER NOT NULL DEFAULT 0,
    round_number     INTEGER NOT NULL DEFAULT 0
);
```

`current_question_index` counts questions from zero, and the domain property
behind it is `QuizProgress.CurrentQuestionIndex` — the whole stack, up to the
`questionIndex` field of the quiz view on the wire, uses that one 0-based
convention, so the quiz exit guard (T2c) compares against
`questionCount - 1` and nothing converts between a number and an index.
`shown_value_count` counts the values already presented, and the value
presentation exit guard (T2c) reads it to decide whether the walk is
complete.

### Roster

```sql
CREATE TABLE participants (
    id                 TEXT PRIMARY KEY,
    session_identity   TEXT NOT NULL REFERENCES sessions(identity)
);
```

### Quiz answers

```sql
CREATE TABLE quiz_answers (
    session_identity TEXT    NOT NULL REFERENCES sessions(identity),
    question_index   INTEGER NOT NULL,
    participant_id   TEXT    NOT NULL REFERENCES participants(id),
    answer_index     INTEGER NOT NULL,
    PRIMARY KEY (session_identity, question_index, participant_id)
);
```

### Value selection

```sql
CREATE TABLE value_selections (
    session_identity TEXT NOT NULL REFERENCES sessions(identity),
    participant_id   TEXT NOT NULL REFERENCES participants(id),
    value_id         TEXT NOT NULL,
    PRIMARY KEY (session_identity, participant_id, value_id)
);

CREATE TABLE selection_submissions (
    session_identity TEXT NOT NULL REFERENCES sessions(identity),
    participant_id   TEXT NOT NULL REFERENCES participants(id),
    PRIMARY KEY (session_identity, participant_id)
);

CREATE TABLE top_values (
    session_identity TEXT NOT NULL REFERENCES sessions(identity),
    value_id         TEXT NOT NULL,
    PRIMARY KEY (session_identity, value_id)
);
```

### Groups

```sql
CREATE TABLE groups (
    id                     INTEGER PRIMARY KEY AUTOINCREMENT,
    session_identity       TEXT    NOT NULL REFERENCES sessions(identity),
    name                   TEXT    NOT NULL,
    scribe_participant_id  TEXT    REFERENCES participants(id),
    is_submitted           INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE group_members (
    group_id       INTEGER NOT NULL REFERENCES groups(id),
    participant_id TEXT    NOT NULL REFERENCES participants(id),
    PRIMARY KEY (group_id, participant_id)
);

CREATE TABLE group_assigned_values (
    group_id INTEGER NOT NULL REFERENCES groups(id),
    value_id TEXT    NOT NULL,
    PRIMARY KEY (group_id, value_id)
);

CREATE TABLE group_actions (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    group_id   INTEGER NOT NULL REFERENCES groups(id),
    value_id   TEXT    NOT NULL,
    text       TEXT    NOT NULL,
    sort_order INTEGER NOT NULL
);
```

### Final voting (anonymous by schema)

```sql
CREATE TABLE vote_tallies (
    session_identity TEXT    NOT NULL REFERENCES sessions(identity),
    round_number     INTEGER NOT NULL,
    value_id         TEXT    NOT NULL,
    vote_count       INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY (session_identity, round_number, value_id)
);

CREATE TABLE voted_participants (
    session_identity TEXT    NOT NULL REFERENCES sessions(identity),
    round_number     INTEGER NOT NULL,
    participant_id   TEXT    NOT NULL REFERENCES participants(id),
    PRIMARY KEY (session_identity, round_number, participant_id)
);

CREATE TABLE winning_values (
    session_identity TEXT    NOT NULL REFERENCES sessions(identity),
    value_id         TEXT    NOT NULL,
    rank             INTEGER NOT NULL,
    PRIMARY KEY (session_identity, value_id)
);
```

---

## 3. Schema-Level Anonymity Argument

Vote anonymity is enforced structurally at the database schema level:

| Table | Columns | What it lacks |
|---|---|---|
| `vote_tallies` | session, round, value, count | **No participant column** |
| `voted_participants` | session, round, participant | **No value or vote column** |

These two tables share no foreign key. No SQL join can produce a
(participant, value, count) row. Even with full database access, voter↔vote
linkage is **impossible by schema**.

This mirrors the domain model's invariant I14: "no connection between voter
and votes exists anywhere in the model."

**Test enforcement:** An automated test inspects the EF Core model metadata
and asserts:
- `vote_tallies` entity has no property referencing a participant
- `voted_participants` entity has no property referencing a value or count

---

## 4. Write-Before-Broadcast Flow

Every session mutation follows one code path through `SessionCommandHandler`
(Application layer). No ad-hoc saves.

```
Client intent
    │
    ▼
SessionCommandHandler.HandleAsync(sessionIdentity, mutation)
    │
    ├─ 1. Load Session from ISessionRepository (remembers its revision as
    │     the expected revision)
    │
    ├─ 2. Apply domain mutation (Session method call)
    │     │
    │     ├─ Returns false (nothing changed) → no bump, no persist,
    │     │  no broadcast, no retry
    │     │
    │     └─ Throws on invariant violation → no persist, no broadcast
    │
    ├─ 3. Bump session revision (monotonic, one per accepted mutation)
    │
    ├─ 4. Persist via ISessionRepository.SaveAsync(session, expectedRevision)
    │     │
    │     ├─ Compare-and-set on the stored revision column; another writer
    │     │  won the race, or no row exists at all → ConcurrencyConflict-
    │     │  Exception, nothing written
    │     │
    │     └─ Failure → exception propagates, no broadcast
    │
    └─ 5. Broadcast via IBroadcaster
          │
          └─ Only reached after successful persist
```

**Structural guarantee:** broadcast runs only after persist succeeds. There
is no alternate mutation path — all session commands enter through the
handler.

**Create is its own path.** A session comes into existence only through
`ISessionRepository.CreateAsync(session)`, an explicit insert at
`revision = 0` driven by `POST /api/sessions`. `SaveAsync` therefore no
longer inserts: a save against an absent row is a
`ConcurrencyConflictException`, and a `CreateAsync` for an identity that
already exists is one too. That closes the gap Task 9b left open: while
`SaveAsync` still inserted, "no row at all" and "a row stored at revision 0"
were the same situation to a save with `expectedRevision = 0`, so a write
against a session that had been deleted underneath it looked like a
successful compare-and-set. An update can now only ever hit a row that a
create put there.

**Conflict handling:** a `ConcurrencyConflictException` restarts the flow at
step 1 — the handler loads the session again, so the mutation is re-applied
to the state the winning writer stored, and bumps that session's revision.
The budget is three attempts in total. The revision therefore grows by
exactly one per accepted mutation, never once per attempt. After the third
conflict the exception propagates and `IntentPipeline` turns it into
`IntentResult.Rejected(ConcurrencyConflict, …)`: nothing persisted, nothing
broadcast, state unchanged.

**Mutation contract:** a retry re-executes the mutation delegate against the
freshly loaded session, so the delegate must be a pure function of the
`Session` it receives — it decides only from that aggregate and writes only
to it. Side effects outside the aggregate (broadcasts, outbound calls,
captured counters, wall-clock or random values kept outside the domain) would
happen once per attempt and are therefore forbidden in the delegate.

A save that cannot take the SQLite write lock before its timeout elapses
(`SQLITE_BUSY`) is reported as a `ConcurrencyConflictException` too, so it
uses the same retry budget instead of surfacing a storage-specific failure.

Because a retry must see the winning writer's state, `SqliteSessionRepository`
reads without change tracking and clears the tracker before a write, so no
stale EF identity-map snapshot can be re-saved.

---

## 5. Recovery Procedure

On startup:

1. `WorkshopDatabaseSchema.ApplyAsync()` — apply pending migrations
2. `ISessionRepository.LoadAllAsync()` — load all stored sessions
3. Reconstruct domain `Session` objects from EF entities
4. Register in the in-memory session registry (available for SignalR
   hubs)

Sessions resume at their exact prior state. No client action needed —
reconnecting clients are pushed the full current state on connect
(`design/protocol.md` § 3).

---

## 6. EF Core Entity Mapping

Entity classes live in `Adapters.Persistence/Entities/` — EF-friendly POCOs,
separate from domain types. Domain stays pure with no EF references.

```
Domain objects ──→ DomainEntityMapper ──→ EF entities ──→ SQLite
                        ↕
Domain objects ←── DomainEntityMapper ←── EF entities ←── SQLite
```

`SqliteSessionRepository` uses `DomainEntityMapper` to translate between
the two worlds. The mapper is a pure stateless function class — no
dependencies, easily testable.

### Mapping strategy

- **Create:** insert the session row and its entity graph at `revision = 0`;
  a duplicate `identity` surfaces as `ConcurrencyConflictException`.
- **Save:** convert domain `Session` + building blocks → entity graph, then
  update the existing rows (clear + re-add child collections for simplicity;
  the compare-and-set guard on `revision` ensures only the winning
  writer's transaction commits — see § 4).
- **Load:** query full entity graph with `.Include()` chains, then
  reconstruct domain objects via internal constructors / factory methods.

### Domain object hydration

Domain building blocks (`Roster`, `QuizProgress`, etc.) expose internal
state through read-only properties but are constructed with mutable private
fields. For persistence hydration:

- Each building block exposes a static `Restore(...)` factory method
  (internal, Adapters.Persistence has `InternalsVisibleTo`) that sets all internal
  state without re-running validation — the data was already validated when
  originally created.
- `Session` itself has a `Restore(...)` factory that composes all building
  blocks.

This avoids polluting the domain API while allowing persistence to
reconstruct exact state.
