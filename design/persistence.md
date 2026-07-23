# Persistence — ValuesWorkshop

Living document. Deviations discovered during implementation update this file
in the same PR (Ask-first).

---

## 1. Storage Technology

SQLite via EF Core (`Microsoft.EntityFrameworkCore.Sqlite`). Single file
database at `$DATA_DIR/valuesworkshop.db` (default `DATA_DIR=data`).

No migration framework. Schema created via `EnsureCreated()` on startup.
During development, drop and recreate the DB file on schema changes.

---

## 2. Table Schema

One table per concern — no "god tables". Session table holds only identity,
phase, and timestamp. Per-phase state gets its own table.

### Core

```sql
CREATE TABLE sessions (
    identity           TEXT    PRIMARY KEY,
    current_phase      INTEGER NOT NULL,
    created_at         TEXT    NOT NULL
);
```

### Per-phase state (1:1 with session)

```sql
CREATE TABLE quiz_state (
    session_identity         TEXT    PRIMARY KEY REFERENCES sessions(identity),
    current_question_index   INTEGER,
    is_revealed              INTEGER NOT NULL DEFAULT 0,
    is_learning_text_shown   INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE presentation_state (
    session_identity       TEXT PRIMARY KEY REFERENCES sessions(identity),
    presenting_group_name  TEXT,
    presented_value_id     TEXT
);

CREATE TABLE voting_state (
    session_identity TEXT    PRIMARY KEY REFERENCES sessions(identity),
    round_open       INTEGER NOT NULL DEFAULT 0,
    round_number     INTEGER NOT NULL DEFAULT 0
);
```

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
    ├─ 1. Load Session from ISessionRepository
    │
    ├─ 2. Apply domain mutation (Session method call)
    │     │
    │     └─ Throws on invariant violation → no persist, no broadcast
    │
    ├─ 3. Persist via ISessionRepository.SaveAsync()
    │     │
    │     └─ Failure → exception propagates, no broadcast
    │
    └─ 4. Broadcast via IBroadcaster (no-op until Task 9)
          │
          └─ Only reached after successful persist
```

**Structural guarantee:** broadcast runs only after persist succeeds. There
is no alternate mutation path — all session commands enter through the
handler.

---

## 5. Recovery Procedure

On startup:

1. `EnsureCreated()` — create tables if DB is new
2. `ISessionRepository.LoadAllAsync()` — load all stored sessions
3. Reconstruct domain `Session` objects from EF entities
4. Register in the in-memory session registry (available for SignalR
   hub in Task 9)

Sessions resume at their exact prior state. No client action needed —
reconnecting clients receive current state via the normal snapshot mechanism
(Task 9).

---

## 6. EF Core Entity Mapping

Entity classes live in `Adapters/Persistence/Entities/` — EF-friendly POCOs,
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

- **Save:** convert domain `Session` + building blocks → entity graph,
  then `DbContext` upsert (clear + re-add child collections for simplicity;
  single-writer per session means no contention).
- **Load:** query full entity graph with `.Include()` chains, then
  reconstruct domain objects via internal constructors / factory methods.

### Domain object hydration

Domain building blocks (`Roster`, `QuizProgress`, etc.) expose internal
state through read-only properties but are constructed with mutable private
fields. For persistence hydration:

- Each building block exposes a static `Restore(...)` factory method
  (internal, Adapters has `InternalsVisibleTo`) that sets all internal
  state without re-running validation — the data was already validated when
  originally created.
- `Session` itself has a `Restore(...)` factory that composes all building
  blocks.

This avoids polluting the domain API while allowing persistence to
reconstruct exact state.
