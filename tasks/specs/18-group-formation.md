# Spec 18 — Phase 5: Group formation

## Objective

Entering phase 5 forms the groups for real: the CP-SAT solver (Task 17)
partitions the roster and deals the phase-4 top values out; groups get
animal names; every screen shows the result (participant: own group
card; facilitator: all groups; presenter: paginated group cards). The
assignment is fixed once formed (I8), survives restart identically, and
late joiners are placed into the smallest group. e2e extends through
phase 5.

## Scope

### 1. Domain — FormGroups + I8 through Domain ports

- Group formation is a domain procedure (Lavish decision): the trigger
  comes from the frontend (facilitator `AdvancePhase` intent), and the
  Domain talks to the solver through an interface it owns.
  `IGroupSolver` moves from `Application/Ports/Driven/` to
  `Domain/Ports/` (`ISessionRepository` precedent; its records already
  speak only Domain types). A second Domain port `IAnimalNames`
  exposes the ordered animal ids.

  > **Amended in implementation:** both ports live in the Domain ROOT
  > namespace `ValuesWorkshop.Domain` (`IRandomness` precedent), not in
  > `Domain/Ports/` — the solver records reference Domain types, so a
  > `ValuesWorkshop.Domain.Ports` namespace would form a cycle with
  > `ValuesWorkshop.Domain`, which the ArchUnit slice rule
  > (`ValuesWorkshop.(*)` slices free of cycles) forbids.
- Both are passed into `Session.AdvancePhase(caller, exitGuards,
  groupSolver, animalNames)` — collaborators like `exitGuards`, not
  data fixtures (the 16a objection was threading *data*; interfaces
  passed at the point of use are the established double-dispatch
  shape).
- Entry hook into `GroupFormation`: Session builds the solver request
  from its own state (roster, per-participant selections, top values),
  calls the solver, creates `Group` instances (existing restore-shell
  aggregate) with animal labels in deterministic group order. I8
  guard: groups-already-formed → no-op (idempotent-repeat; restore
  path never re-forms); phase guard via the hook location itself.
- Animal labels: ids from `config/animals.json` (8 ids ≥ max 7 groups
  for N=30), stable across restarts. Host loader `AnimalsCatalogFile`
  with fail-fast validation (values-catalog pattern) implements
  `IAnimalNames` (ids, Domain) and the Application-side text lookup for
  views; TestSupport fake; group-count > animal count fails loudly.
- Late joiner: verify the existing `Session.Join` →
  `PlaceIntoSmallestGroup` path against state-machine §2.5 (fewest
  members, no value re-deal, only from phase 5 on) — test it; fix if
  the shell diverges from the design.
- Persistence: existing `groups`/`group_members`/`group_assigned_values`
  tables + `DomainEntityMapper` restore path — round-trip test: form →
  save → load → identical groups (names, members, values, order).

### 2. Application — wiring + phase-5 views

- `FacilitatorIntentHandler` receives `IGroupSolver` + `IAnimalNames`
  by DI and hands them to `AdvancePhase` — no request-building, no
  orchestration in the handler; advance + formation persist atomically
  in the existing single save. An Application test asserts
  advance-into-5 forms groups.
- Solver failure: fail loud (Task 17 decision — model always feasible;
  no fallback mechanism now).
- `CpSatGroupSolver` (Host) now implements the Domain interface —
  relocation only, single-file OR-Tools boundary + architecture test
  unchanged.
- Per-role views per protocol §5.2–5.4, restricted to what phase 5
  needs (scribe/actions fields are Task 19/20 — optional, absent, like
  tallies were in phase 3):

  > **Amended in implementation:** the scribe/work-status fields were
  > REMOVED from the shipped view records rather than carried as null —
  > Task 19 re-adds them as optionals; protocol.md §5 documents them as
  > absent until T19/T20.
  - participant `ownGroup`: animal name, member display names, own
    assigned value ids
  - facilitator `groups`: all groups (name, member names + ids,
    assigned value ids)
  - presenter `groups`: name, member names, assigned value ids
  - group name travels as animal id + localized text `{de,en}` on the
    wire (values-catalog precedent — FE never reads `config/`); if
    protocol.md's current wording ("localized by the client") reads
    otherwise, align protocol.md in the same PR
  - selection block behavior in phase 5 stays as shipped (Task 16
    learning: plain `Progress` — tallies drop off after phase 4)
- FE zod reconciled (current stubs are thinner than protocol —
  reshape to exactly what the server now sends).

### 3. FE — three phase-5 screens

- Participant: own group card — animal name (no icon), members
  top-left, own values bottom-right, distinct colors, no "Members"/
  "Your values" labels (Lavish: content self-explanatory);
  localized value texts from the wire.
- Facilitator: all groups (names, members, values) + Advance (no
  guard).
- Presenter: paginated 3×2 group cards cycling every 7 s (single page
  static when ≤6 groups — e2e uses 1 group); each card mirrors the
  participant card layout (name, members, values — not name-only).
- Replace `EmptyPhase` mapping for `GroupFormation` in all three
  `phaseView.ts`.

### 4. e2e + docs

- Extend the multi-client spec: advance the existing 3-participant
  session into phase 5 → one group of 3 (G = max(1, floor(3/4)) = 1)
  holding all top values; each participant sees the same animal-named
  card with 3 members; facilitator + presenter show the group;
  deterministic assertions (label from animals.json translations,
  English).
- Docs same PR: persistence.md group tables section (if missing),
  protocol.md §5 alignment, todo.md Task 18 tick + learnings for
  Task 19.

## Out of scope

Scribes (`AppointScribes` fires on P5→P6 entry — Task 19), actions,
group work views, submit states, presenter pagination stress (>6
groups) beyond unit tests, solver fallback mechanism.

## Success criteria

- [ ] Advance into phase 5 forms groups exactly once (I8): repeat/
      restore never re-forms; assignment survives restart identically
      (round-trip + restart test)
- [ ] Late joiner in phase ≥5 lands in the smallest group, values
      untouched, sizes stay within one
- [ ] Each participant sees own group (animal name, members, values);
      facilitator + presenter see all groups
- [ ] Solver inputs = roster + own selections + top values; groups
      sized per `GroupSizing`
- [ ] e2e through phase 5 green in CI
- [ ] `./scripts/ci-lint.sh` + `./scripts/ci-test.sh` green

## Verification

`./scripts/ci-lint.sh` · `./scripts/ci-test.sh` (jest + dotnet + e2e)

## Slices (implementation order)

1. Domain FormGroups + I8 + animal assignment + late-join verify +
   round-trip.
2. `IAnimalsCatalog` port + Host loader + orchestration in the
   facilitator handler + Application tests.
3. Per-role views + protocol.md alignment + zod reconciliation.
4. FE screens ×3 + tests.
5. e2e phase-5 extension + docs + todo tick.

## Decisions (for this review)

1. **Group formation is a domain procedure** (review): trigger from
   the frontend, Domain calls the solver through a Domain-owned
   interface — `IGroupSolver` (+ `IAnimalNames`) move to
   `Domain/Ports/` and are passed into `AdvancePhase` like
   `exitGuards`; Session builds the request from its own state and
   forms the groups in the entry hook. Collaborator interfaces, not
   data fixtures — 16a stays honored.
2. **Animal names ride the wire** as id + `{de,en}` text (values
   precedent); client renders, never reads config.
3. **Late-joiner placement is in scope** (state-machine §2.5 demands it
   from phase 5 on; the shell code already exists — verified + tested).
4. **Fail loud on solver failure** (always-feasible model; fallback
   decorator deferred until a real need appears).
5. **Scribe/actions fields deferred** to Task 19/20 as absent optionals
   (tallies pattern).
