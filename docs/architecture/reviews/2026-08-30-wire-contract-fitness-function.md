# Make the FE/BE wire contract machine-checked

**Date:** 2026-08-30
**Scope:** `backend/Application/State/**`, `backend/Application/Intents/IntentRejectionCode.cs`,
`backend/Adapters.Web/{FacilitatorHub,ParticipantHub,PresenterHub}.cs`,
`frontend/src/domain/workshopState{,Schemas,Blocks,Variants}.ts`,
`frontend/src/domain/intentResult.ts`, `frontend/src/adapters/*Adapter.ts`,
`frontend/scripts/generatePhasesModule.mts`, `design/protocol.md`
**Status:** Adopted — implemented; step 1 in PR #52, steps 2-7 per
`tasks/specs/23a-wire-contract-fitness-function.md`

---

## 1. Context

The evidence run for 2026-08-30 shows a backend and a frontend that each look
healthy on their own. Backend layering is enforced by ArchUnit
(`backend/Domain.Tests/ArchitectureTests.cs`: layer rules plus
`No_cyclic_dependencies_between_assemblies`), frontend layering and role
isolation by dependency-cruiser (`frontend/.dependency-cruiser.cjs`: 13
forbidden rules incl. `no-circular`), and both run in `scripts/ci-lint.sh`.
The top temporal-coupling pairs are all production↔its-own-test pairs
(`backend/Application` ↔ `backend/Application.Tests`, 54 co-changes, support
0.74) — that is TDD, not erosion.

What the module table cannot show is the one boundary that has **no module
row at all**, because it runs _between_ the two trees the analysis splits:
the SignalR wire contract. Counting commits over the full history (542
commits, 2026-07-19 → 2026-08-29) against the two sides of that seam:

| Side                         | Paths counted                                                                    | Commits |
| ---------------------------- | -------------------------------------------------------------------------------- | ------- |
| backend wire types only      | `Application/State/**`, `IntentRejectionCode.cs`, `*Hub.cs`, `Submit*Payload.cs` | 37      |
| frontend mirror only         | `domain/workshopState*.ts`, `domain/intentResult.ts`                             | 18      |
| **both sides in one commit** |                                                                                  | **9**   |

9 of 64 (14%). Widened to the ports and adapters that carry the same
contract (`frontend/src/domain/ports/**`, `frontend/src/adapters/**`): 35
backend-only, 55 frontend-only, **11 of 101 (11%)** touching both sides.

The mirrored surface, counted in today's tree:

- **27** phase-variant records (`ParticipantWorkshopState.cs`,
  `FacilitatorWorkshopState.cs`, `PresenterWorkshopState.cs` — 9 sealed
  variants each, plus one abstract base per role) ↔ **27** `z.object`
  variants in `frontend/src/domain/workshopStateSchemas.ts`
- **22** record declarations in `WorkshopStateBlocks.cs` + **9** in
  `FormationBlocks.cs` ↔ **29** named schemas in
  `frontend/src/domain/workshopStateBlocks.ts`
- **17** hub methods (`FacilitatorHub` 9, `ParticipantHub` 8) ↔ **16** enum
  members (`FacilitatorIntent` 9, `ParticipantIntent` 7)
- **7** wire enums (`Phase`, `IntentRejectionCode`, `FacilitatorIntent`,
  `QuizSubState`, `GroupWorkStatus`, `FormationSubState`, plus the
  frontend-only `ParticipantIntent` whose _values are backend method names_)
- ~1 800 lines of C# ↔ ~465 lines of TypeScript

Machine checks that cross the seam today: **one**. `pnpm --dir frontend lint`
runs `phases:check`, which regenerates `frontend/src/domain/phases.ts` from
`backend/Domain/Phase.cs` and fails on a diff
(`frontend/scripts/phaseEnumCodegen.mts`). Nothing checks the other six
enums, the 17 method names, or any of the ~56 record/schema shapes.

---

## 2. Finding

**The FE/BE wire contract is a load-bearing, fully specified boundary whose
alignment is maintained by author discipline and one enum codegen. Every
other part of it — method names, argument lists, state shapes, enum wire
values — is a hand-kept mirror with no driver.**

`design/protocol.md` (36 KB) specifies this contract precisely: § 4 the
intent catalog per hub, § 5 the per-role phase-discriminated state, § 6.2
`IntentRejectionCode`, § 7 the frontend port slices. It opens with "Living
document. The FE/BE contract for real-time communication." The contract is
therefore _intentional and documented_ — it is only unenforced. Per the
evolutionary-architecture rule this run is written against: a boundary that
is not machine-checked erodes silently.

**The failure mode is silent by construction.** Names cross the wire as
strings — `invokeIntent(connection, ParticipantIntent.AddAction, valueId)` in
`frontend/src/adapters/participantGroupWorkAdapter.ts` reaches
`ParticipantHub.AddAction(string? valueId)` through SignalR's string
dispatch, so neither `tsc` nor `dotnet build` can see a mismatch. On the
inbound path it is worse than a crash: `createSessionStatePort` in
`frontend/src/adapters/sessionStateAdapter.ts` does

```typescript
const parsed = schema.safeParse(payload);
if (!parsed.success) {
  console.error("Dropped an unparsable workshop state", parsed.error);
  return EMPTY;
}
```

A drifted state block is dropped, not surfaced. The screen keeps showing the
last state that parsed — a frozen wall in a live workshop, with the evidence
in a browser console nobody is watching.

**Evidence that keeping the mirror aligned is real, recurring work.** Inside
one PR (#42 `task-20-group-work-frontend`) the branch needed three repair
commits whose only content is re-aligning one side with the other:

- `ed34e28` (2026-08-24 06:22) added the group-work ports with
  `addAction(actionId, valueId, text)`; `a8e3540` (06:43, 21 minutes later)
  "Fix port signatures to match backend hub methods" cut it to
  `addAction(valueId)` across 10 files.
- `75c972e` (2026-08-25 19:52, backend) "Drop the AddAction text parameter"
  → `3ce75c6` (19:52) and `118fef6` on the frontend.
- `40fa925` (2026-08-25 15:49, backend) "Restructure SubmitGroupWork wire
  payload as actions grouped per value" → `b05db3a` (15:50) on the frontend.

Honest reading: none of these reached `main` broken — one author held both
sides in one branch and caught each mismatch by inspection. That is exactly
the point. The invariant is currently protected by a person's attention, and
the _only_ enforcement listed in the review checklist that counts —
types, tests, linters — is absent here.

**That protection is already eroding.** The mirror is incomplete on `main`
right now: `ParticipantHub.SubmitFinalVotes` has existed since `431286d`
(2026-08-26, PR #45) and `SubmitFinalVotes` appears **nowhere** in
`frontend/src` — grep returns zero hits. Nothing reports that; Task 23 will
add it, and the only thing telling that author the name, the argument shape
(`SubmitFinalVotePayload[]`) and the rejection codes is prose in
`design/protocol.md`, re-read by hand.

Meanwhile the two most recent daily-maintenance runs both spent themselves on
this seam, one side at a time:

- `9370566` (2026-08-29) "Pin the participant group-work hub calls with
  adapter tests" — frontend test asserting `invoke` was called with
  `"AddAction"`.
- `68404f1` (2026-08-30, branch `maintenance/2026-08-30-final-voting-hub-tests`)
  "Pin the final-voting hub calls with adapter tests" — backend tests over
  `ParticipantHub.SubmitFinalVotes`.

Both commit messages cite `a8e3540` as the precedent. Neither test can
detect drift: the frontend test pins the frontend's _belief_ about the
contract, the backend test pins the backend's _own_ signature, and nothing
compares the two. This is the signature of a problem at the wrong zoom
level — file-level fixes cannot buy the guarantee, so they keep being bought
anyway.

**Blast radius.** Every feature from here on crosses this seam: Tasks 23
(final voting frontend), 24 (phase 9 + PDF), 26 (i18n completeness) all add
wire surface. And the runtime backstop stops early: the Playwright suite
(`e2e/*.spec.ts`, 63 tests) reaches phase 7 — its last test is "the
facilitator walks every group block on the wall and fixes a typo live" —
so phases 8 (`FinalVoting`) and 9 (`FinalPresentation`), the newest wire
surface, have **no** end-to-end check at all, and by plan (Tasks 23, 24, 27)
will not for several tasks.

---

## 3. Proposal

### Target state

One checked-in artifact, `contract/`, produced by backend tests and consumed
by frontend tests. It is the machine-checked shadow of `design/protocol.md`
§§ 4–6:

```
contract/
  intents.json                 method name + parameter names per hub, plus
                               the server→client callback name
  enums.json                   each wire enum member as the serializer
                               actually writes it (1 / "editing" / …)
  state/<role>/<phase>.json    one serialized sample per role × phase
```

Producer: `backend/Adapters.Tests` (already owns `WireFormatTests.cs` with
all three mappers and the `JsonHubProtocol` serializer). Consumer:
`frontend/src/domain/__tests__` and `frontend/src/adapters/__tests__`. Both
sides fail loudly on drift, in the same PR that causes it, from gates that
already run (`pnpm --dir frontend test`, `dotnet test backend`).

Two properties make this affordable:

1. **Additive changes stay cheap.** Zod `z.object` strips unknown keys, so a
   new block or field does not break the frontend consumer; only a rename,
   a removal or a retype does — which is precisely the breaking set.
2. **The frontend is allowed to lag.** The intent assertion runs
   frontend ⊆ backend (every name the frontend can _send_ must exist on a
   hub), so today's missing `SubmitFinalVotes` does not block adoption.

Names are literal everywhere: `contract/intents.json` contains the string
`"AddAction"`, so grepping `AddAction` lands on the hub method, the frontend
enum member and the contract file — three literal hits, no constructed
names, no reflection-driven dispatch in production code.

### Stepwise plan

Every step is behaviour-preserving, lands green on its own, and is one daily
run in size. Steps 1/3/5 add a producer plus its checked-in output; steps
2/4/6 add the consumer that reads it.

1. **`contract/intents.json` + producer** (~120 lines,
   `backend/Adapters.Tests/WireContractTests.cs`). An explicit table built
   from `nameof(FacilitatorHub.AdvancePhase)` … so a C# rename breaks the
   build, serialized to the checked-in file and compared; plus a completeness
   assertion: every public instance method of the two hub types returning
   `Task<IntentResult>` appears in the table (the silent-registration guard).
2. **Frontend intent consumer** (~80 lines,
   `frontend/src/adapters/__tests__/wireIntents.test.ts`). Build every port
   with a recording `WebsocketConnection`, call each method with placeholder
   arguments, and assert for each recorded `invoke(name, ...args)` that
   `name` exists in the catalog for that role and `args.length` equals the
   catalog's parameter count. This is the check that would have caught
   `a8e3540` mechanically.
3. **`contract/enums.json` + producer** (~60 lines). Serialize every member
   of `Phase`, `IntentRejectionCode`, `FacilitatorIntent`, `QuizSubState`,
   `GroupWorkStatus` and the `FormationSubState` discriminators through the
   _real_ `JsonSerializerOptions`, so the file records the wire form
   (`3`, `"editing"`, `"forming"`) rather than a source-parsed guess.
4. **Frontend enum consumer** (~40 lines,
   `frontend/src/domain/__tests__/wireEnums.test.ts`): each TypeScript enum
   equals its entry in `contract/enums.json`. `phases.ts` keeps its codegen —
   generation and verification are different jobs and both stay.
5. **`contract/state/<role>/<phase>.json` + producer** (~120 lines). 27
   samples from `TestSessions.InPhase` with fixed `Guid`s and
   `FixedRandomness` for determinism, serialized exactly as
   `WireFormatTests.SerializeStateMessage` does and stored as
   `arguments[0]`. `CONTRACT_WRITE=1 dotnet test …` rewrites; the default run
   compares and prints the diff.
6. **Frontend state consumer** (~60 lines,
   `frontend/src/domain/__tests__/wireContract.test.ts`): `it.each` over the
   27 fixtures, `<role>WorkshopStateSchema.parse(fixture)` must succeed and
   yield the expected `phase`; plus a completeness test that the fixture set
   is exactly the 9 phases × 3 roles.
7. **Variant coverage** (~60 lines, backend). Reflect over the
   `[JsonDerivedType]` attributes in `Application/State` and assert every
   discriminator (`forming`/`formed`, both `GroupWorkStatus` values, an open
   and a closed voting round, `ownGroup: null`) appears in at least one
   fixture — so the corpus cannot rot into sample-luck as phases 8–9 land.

Steps 1–2 alone close the defect class that has already been repaired three
times by hand. If the human stops there, the proposal still paid.

---

## 4. Fitness function

The boundary is locked by two tests that already-running gates execute.

**Frontend consumer** (`frontend/src/adapters/__tests__/wireIntents.test.ts`,
run by `pnpm --dir frontend test`):

```typescript
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { NEVER, of } from "rxjs";
import { createParticipantGroupWorkPort } from "../participantGroupWorkAdapter";
// … the other port factories

const catalog: Record<string, { name: string; parameters: string[] }[]> =
  JSON.parse(
    readFileSync(
      resolve(__dirname, "../../../../contract/intents.json"),
      "utf8",
    ),
  );

function recordingConnection() {
  const invoke = jest.fn(() =>
    of({ isAccepted: true, code: null, detail: null }),
  );
  return {
    invoke,
    connection: {
      connectionState: NEVER,
      start: NEVER,
      stop: NEVER,
      on: () => NEVER,
      invoke,
    },
  };
}

describe("every intent the frontend can send exists on its hub", () => {
  it("participant group work", () => {
    const { connection, invoke } = recordingConnection();
    const port = createParticipantGroupWorkPort(connection);

    port.addAction("value-1").subscribe();
    port.editAction("action-1", "text").subscribe();
    // … every method of the port

    for (const [name, ...args] of invoke.mock.calls) {
      const method = catalog.participant.find((m) => m.name === name);
      expect(method).toBeDefined();
      expect(args).toHaveLength(method!.parameters.length);
    }
  });
});
```

**Backend producer + completeness**
(`backend/Adapters.Tests/WireContractTests.cs`, run by `dotnet test`):

```csharp
private static readonly IntentCatalog Catalog = new(
    Facilitator: [
        new(nameof(FacilitatorHub.AdvancePhase), []),
        new(nameof(FacilitatorHub.ReassignScribe), ["participantId"]),
        // …
    ],
    Participant: [
        new(nameof(ParticipantHub.AddAction), ["valueId"]),
        new(nameof(ParticipantHub.SubmitFinalVotes), ["votes"]),
        // …
    ],
    StateCallback: nameof(IParticipantClient.ReceiveWorkshopState));

[Fact]
public void The_checked_in_intent_catalog_matches_the_hubs()
{
    var written = JsonSerializer.Serialize(Catalog, ContractJson);
    File.ReadAllText(ContractPath("intents.json")).ShouldBe(written);
}

[Fact]
public void Every_hub_intent_is_listed_in_the_catalog()
{
    foreach (var hub in new[] { typeof(FacilitatorHub), typeof(ParticipantHub) })
    {
        var declared = hub.GetMethods(BindingFlags.Public | BindingFlags.Instance | BindingFlags.DeclaredOnly)
            .Where(method => method.ReturnType == typeof(Task<IntentResult>))
            .Select(method => method.Name);

        declared.ShouldBeSubsetOf(Catalog.NamesOf(hub));
    }
}
```

Property that matters: a rename of `ParticipantHub.AddAction` breaks the C#
build (via `nameof`), then the fixture comparison, then — once the file is
regenerated — the frontend test, in that order, inside one PR. The seam
stops being folklore.

---

## 5. Alternatives rejected

- **Generate the zod schemas from the C# records.** Rejected: the frontend
  schemas carry frontend-only refinements (`participantQuizViewSchema`
  refines `ownAnswerIndex < answers.length`) that generation would erase, and
  a source-level C# parser would have to understand `JsonPolymorphic`,
  `JsonIgnoreCondition.WhenWritingNull` and `IReadOnlyDictionary`. The
  existing `phaseEnumCodegen.mts` regex works because `enum Phase` is trivial;
  56 records are not.
- **Export JSON Schema from `System.Text.Json` and diff it against zod.**
  Rejected: comparing two schema languages is a project of its own, and the
  result would be a fitness function nobody can debug at 3 a.m.
- **Wait for e2e to cover phases 8–9 (Tasks 23, 24, 27).** Rejected as the
  _primary_ answer: e2e is the slowest, most expensive gate, it only checks
  the paths a scenario happens to walk, and it arrives after the contract has
  been written. The contract corpus runs in unit-test time on both sides and
  covers every role × phase whether or not a scenario exists. e2e stays
  valuable and unchanged.
- **A shared IDL (protobuf / TypeSpec) as the single source of truth.**
  Rejected: it would rewrite both stacks' type definitions, contradicts
  `design/architecture.md`'s hand-written records and `design/protocol.md`'s
  role, and cannot be delivered in daily-agent-sized behaviour-preserving
  steps.
- **Keep relying on `design/protocol.md` and review.** Rejected: that is the
  status quo, and § 2 shows what it costs — three hand repairs in one PR, one
  method missing from the mirror today, two daily runs spent on one-sided
  pins.
- **Do nothing (accept the risk).** Defensible while one author holds both
  sides of every change. It stops being defensible now that agents work one
  side at a time and the frontend is a phase behind the backend.

---

## 6. Non-goals

- Reorganising the three role trees. `frontend/src/app/facilitator` ↔
  `presenter` (28 co-changes, support 0.61), ↔ `participant` (28, 0.56) and
  `participant` ↔ `presenter` (25, 0.54) is a phase feature landing in three
  role views — inherent to the product, already fenced by the six
  `*-must-not-import-*` rules in `.dependency-cruiser.cjs`, and fighting the
  Next.js route layout would be pure cost.
- Changing any runtime behaviour. No production file changes in the whole
  plan; only tests and the checked-in `contract/` artifact.
- Replacing `design/protocol.md`. It stays the human-readable contract; the
  corpus is its machine-checked shadow, not its successor.
- Extending Playwright coverage to phases 8–9 (Tasks 23, 24, 27 own that).
- Touching the `console.error`-and-drop policy in `sessionStateAdapter.ts`.
  It is cited as the reason drift is silent; whether an unparsable state
  should surface to the user is a separate product decision.
- Backend `Adapters.Web` internals (`GroupFormationService`,
  `StateResendService` and `WorkshopStateCache` living beside the hubs) —
  noted here only so a future run can pick it up.
