# Task 9b: Optimistic concurrency for session mutations

## Problem

`SessionCommandHandler.HandleAsync` loads a `Session`, mutates it, bumps
`Revision`, and calls `ISessionRepository.SaveAsync(session)`. `SaveAsync`
re-reads the current row and replaces the whole aggregate, so a save always
wins regardless of what happened since the load. Two concurrent intents
(participant `Join` + facilitator `AdvancePhase`) therefore lost-update each
other: the roster change disappears, and the cache/hub sees a session whose
participant is missing — the `TryGetValue` fallback in `ParticipantHub` is a
symptom of exactly this race.

## Solution

Compare-and-set on the existing `revision` column.

1. `ISessionRepository.SaveAsync(Session session, long expectedRevision)` —
   `expectedRevision` is the revision the session had when it was loaded.
2. `SqliteSessionRepository` opens its transaction with a single atomic
   guard statement
   `UPDATE sessions SET revision = @new WHERE identity = @id AND revision = @expected`.
   Zero rows affected + a row exists → throw `ConcurrencyConflictException`;
   zero rows affected + no row → insert path (new session, `expectedRevision`
   must be `0`). The guard runs first, so it takes SQLite's write lock before
   the delete-and-reinsert of the child rows.
3. `SessionCommandHandler` captures `expectedRevision` before `BumpRevision()`,
   and on `ConcurrencyConflictException` reloads the session and re-applies the
   mutation, up to 3 attempts total. Broadcast still happens only after a
   successful persist.
4. Retries exhausted → `IntentPipeline` maps the exception to a new
   `IntentRejectionCode.ConcurrencyConflict = 7`, so the caller gets a typed
   rejection and state is unchanged.

## Acceptance criteria

- [ ] Concurrent `Join` + `AdvancePhase` against one session: both mutations
      survive (roster contains the participant *and* the phase advanced)
- [ ] A save whose `expectedRevision` is stale never overwrites the stored
      aggregate; it throws `ConcurrencyConflictException`
- [ ] After the retry budget is exhausted the intent returns
      `IntentResult.Rejected(ConcurrencyConflict, …)`, nothing is persisted,
      nothing is broadcast
- [ ] `revision` increases by exactly one per accepted mutation, never per
      attempt

## Non-goals

- No change to the delete-and-reinsert write strategy.
- No pessimistic locking, no serialized per-session command queue.
- No `revision` semantics change on the wire (`design/protocol.md` §3.4 stays).
- Removing the `ParticipantHub` `TryGetValue` fallback (separate cleanup).

## Slices

1. **Domain/port**: add `expectedRevision` parameter to `ISessionRepository`
   `SaveAsync`, add `ConcurrencyConflictException`; update all call sites and
   test doubles mechanically. Green build, no behaviour change.
2. **Adapter**: compare-and-set guard in `SqliteSessionRepository`, with
   `Adapters.Tests` covering stale-save-throws, fresh-save-succeeds,
   new-session-insert, and two real concurrent `DbContext`s over one
   in-memory SQLite connection.
3. **Handler retry**: `expectedRevision` capture + reload-and-retry loop in
   `SessionCommandHandler`, `Application.Tests` for retry-then-succeed,
   retry-exhausted-throws, and one-bump-per-accepted-mutation.
4. **Rejection code**: `IntentRejectionCode.ConcurrencyConflict`, mapping in
   `IntentPipeline`, `Host.Tests` end-to-end concurrent join+advance over the
   real hubs; update `design/persistence.md` (command flow + conflict
   handling) and `design/protocol.md` (rejection code table).

## Verification

`./scripts/ci-lint.sh`, `./scripts/ci-test.sh`. New BE concurrency tests drive
two intents against one session; the E2E test in `Host.Tests` asserts both
mutations are visible in the broadcast state.
