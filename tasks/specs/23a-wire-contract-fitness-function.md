# Task 23a — Machine-checked FE/BE wire contract (steps 2–7)

Finishes the accepted proposal in
`docs/architecture/reviews/2026-08-30-wire-contract-fitness-function.md`.
Step 1 landed in PR #52: `contract/intents.json` plus its producer
`backend/Adapters.Tests/WireContractTests.cs`. Nothing on the frontend reads
it yet, and the enums and state shapes are still unchecked.

## Objective

The SignalR seam is specified in `design/protocol.md` and enforced by
nothing on the consuming side. Names cross as strings, so neither `tsc` nor
`dotnet build` sees a mismatch, and a drifted state block is silently
dropped by `sessionStateAdapter` (`console.error`, keep last state) — a
frozen wall in a live workshop. This task makes the frontend read the
contract and extends the corpus to the enums and to every role × phase
state shape, so a rename, removal or retype fails a gate that already runs,
in the PR that causes it.

No production code changes: tests plus generated artifacts only.

## Decisions

- **D1 — artifact layout continues step 1's.** `contract/enums.json` (each
  wire enum member in the form the serializer actually writes) and
  `contract/state/<role>/<phase>.json` (27 samples) join `intents.json`,
  same producer file, same `CONTRACT_WRITE=1 dotnet test
  backend/ValuesWorkshop.Tests.slnf` regeneration, same walk-up
  `contract/` lookup (extracted into one helper).
- **D2 — frontend intent consumer (step 2).**
  `frontend/src/adapters/__tests__/wireIntents.test.ts` builds every port
  factory with a recording `WebsocketConnection`, calls every method, and
  asserts each recorded `invoke(name, ...args)` has `name` in that role's
  object in `intents.json` with `args.length` equal to its parameter-name
  count. Plus: every `FacilitatorIntent`/`ParticipantIntent` member exists
  in the catalog. Direction is frontend ⊆ backend — the frontend may lag
  (an unused hub method is fine), it may never invent.
- **D3 — enums corpus (steps 3–4).** Producer serializes every member of
  `Phase`, `IntentRejectionCode`, `FacilitatorIntent`, `QuizSubState`,
  `GroupWorkStatus` and `FormationSubState` through the real
  `JsonHubProtocol` options, so the file records `3` / `"editing"` /
  `"forming"` rather than a source-parsed guess.
  `frontend/src/domain/__tests__/wireEnums.test.ts` asserts each frontend
  enum equals its entry. `phases.ts` keeps its codegen — generation and
  verification are different jobs.
- **D4 — state corpus (steps 5–6).** One populated session per phase
  (roster, selection, groups, walk, voting rounds) with fixed `Guid`s and
  `FixedRandomness`, mapped per role and serialized exactly as
  `WireFormatTests` does, stored as the invocation's `arguments[0]` in
  `contract/state/<role>/<phase>.json`.
  `frontend/src/domain/__tests__/wireContract.test.ts` runs `it.each` over
  the fixtures: the role schema parses, the parsed `phase` is the expected
  one, and the fixture set is exactly 9 phases × 3 roles.
- **D5 — fixtures stay in `backend/Adapters.Tests`.** Built from
  `TestSupport` primitives; `TestSupport` gains what is missing (e.g. an
  optional roster on `TestSessions.InPhase`). No test project references
  another test project; `Application.Tests` keeps its own `SessionFixtures`.
- **D6 — variant coverage guard (step 7).** A backend test reflects over
  the `[JsonDerivedType]` attributes in `Application/State` and asserts
  every discriminator (both `FormationSubState`s, both `GroupWorkStatus`es,
  an open and a closed voting round, `ownGroup: null`) appears in at least
  one fixture, so the corpus cannot rot into sample-luck as phase 9 lands.
- **D7 — docs.** `contract/README.md` (what produces each file, what
  consumes it, how to regenerate); `design/protocol.md` gains a short
  "machine-checked shadow" note naming `contract/`; the ADR's status line
  points at this spec; `tasks/todo.md` gets this task plus Task 23's ticks.

## Slices

1. Frontend intent consumer over every port factory (step 2).
2. `contract/enums.json` + producer (step 3).
3. Frontend enum consumer (step 4).
4. `contract/state/<role>/<phase>.json` + producer, 27 fixtures (step 5).
5. Frontend state consumer, parse + completeness (step 6).
6. Variant-coverage guard (step 7).
7. Docs (D7).

## Verification

`./scripts/ci-lint.sh` + `./scripts/ci-test.sh` green. Drift is proven, not
assumed: hand-editing a name in `contract/intents.json` must fail the new
frontend test, and dropping a field from a state block must fail the state
consumer — both re-checked by hand before the PR.
