# Architecture — ValuesWorkshop

Living document. Deviations discovered during implementation update this file
in the same PR (Ask-first).

---

## 1. Hexagonal Architecture

Both backend and frontend follow hexagonal (ports & adapters) architecture.
Dependencies point inward: outer layers depend on inner layers, never the
reverse. Ports (abstract interfaces) live inside the domain layer and are
implemented by adapters in the outer layer.

The measured counterpart of this section is generated, not drawn:
`docs/quality/frontend-modules.mmd` folds dependency-cruiser's report onto the
folders below, `docs/quality/backend-layers.mmd` is parsed from the `.csproj`
references, and `docs/quality/metrics.md` holds the rule counts and violations
the gates report. Both diagrams are drift-gated against the code.

### 1.1 Backend Layers

```
Domain (pure logic + port interfaces)
  ↑
Application (use cases, orchestration)
  ↑
Adapters.Persistence (SQLite/EF)
Adapters.Web (SignalR hub, OIDC, HTTP)
  ↑
Host (composition root, DI wiring, startup, OR-Tools)
```

| Layer | Assembly | Depends on | Contains |
|---|---|---|---|
| **Domain** | `ValuesWorkshop.Domain` | Nothing | Aggregates, value objects, domain events, port interfaces, invariants |
| **Application** | `ValuesWorkshop.Application` | Domain | Use cases, command handlers, application services |
| **Adapters.Persistence** | `ValuesWorkshop.Adapters.Persistence` | Application, Domain | EF Core + SQLite persistence |
| **Adapters.Web** | `ValuesWorkshop.Adapters.Web` | Application, Domain | SignalR hub, HTTP, OIDC adapters |
| **Host** | `ValuesWorkshop.Host` | Adapters.Persistence, Adapters.Web (transitive: Application, Domain) | Composition root, DI registration, middleware, startup, OR-Tools |

**Enforced by:** ArchUnitNET rules in xUnit tests (`dotnet test backend`).

### 1.2 Frontend Layers

```
domain/ (pure logic + port interfaces)
  ↑
adapters/ (implements port interfaces)
  ↑
app/ (screens, DI wiring — per-role screen groups)
```

| Layer | Directory | Depends on | Contains |
|---|---|---|---|
| **domain** | `src/domain/` | Nothing app-internal | Pure state logic, reducers, value types; `ports/` subdirectory holds port interfaces (gateway types) |
| **adapters** | `src/adapters/` | domain | Port implementations (SignalR client, API client, stubs) |
| **app** | `src/app/` | domain, adapters (via DI context only) | Screen components, DI context providers, routing |

**Enforced by:** dependency-cruiser rules (`pnpm --dir frontend lint`).

---

## 2. Port Interfaces

Port interfaces define contracts between layers. They live **inside the domain
layer** (not in a separate layer), and are implemented by adapters.

### 2.1 Backend Ports

Domain port interfaces live in `ValuesWorkshop.Domain/Ports/` or in the
Domain root namespace (`ValuesWorkshop.Domain`) when they are passed into
aggregate methods and a `Domain.Ports` sub-namespace would create a cycle
under the ArchUnit slice rule (`IRandomness` precedent).

Current Domain ports:

| Interface | File | Implemented by |
|---|---|---|
| `ISessionRepository` | `Domain/Ports/ISessionRepository.cs` | `SqliteSessionRepository` (Adapters.Persistence) |
| `IGroupSolver` | `Domain/IGroupSolver.cs` | `CpSatGroupSolver` (Host) |
| `IGroupNames` | `Domain/IGroupNames.cs` | `AnimalsCatalogFile` (Host) |

Domain services own procedures that need ports; unlike aggregates they are
container-built (constructor injection) and are sequenced by the intent
handlers. Aggregates stay port-free and own state + invariants.

| Service | File | Ports (ctor) | Called by |
|---|---|---|---|
| `ScribeAppointment` | `Domain/ScribeAppointment.cs` | `IRandomness` | One of the registered `IPhaseEntryAction`s: `FacilitatorIntentHandler` runs them after `Session.AdvancePhase()`; it appoints one random scribe per group on entry into group work and self-guards (no-op outside phase 6, skips groups that already have a scribe so restore/restart never re-appoints) |
| `PresentationOpening` | `Domain/PresentationOpening.cs` | — | `IPhaseEntryAction`: opens the presentation walk on the first group's intro when entering value presentation (phase 7); self-guards (no-op outside phase 7) |
| `VotingOpening` | `Domain/VotingOpening.cs` | — | `IPhaseEntryAction`: opens voting round 1 on entry into final voting (phase 8) with allotment 5, eligible = union of groups' assigned values; self-guards (no-op outside phase 8) |

Group formation is deliberately *not* one of them: phase 5 is entered
unformed and the formation runs on a clock (`design/state-machine.md` § 2.5),
which is orchestration over time — an application concern,
`GroupFormationRunner` below.

How long that clock runs and what it means is domain, though. Two value
objects carry it:

| Value object | File | Rules |
|---|---|---|
| `GroupFormationWindow` | `Domain/GroupFormationWindow.cs` | a window lasts longer than no time at all; `Default` is the three-second window a deployment gets unless it says otherwise (`GROUP_FORMATION_WINDOW_MS`); `ProgressAfter(elapsed)` turns time spent into a `FormationProgress`, clamped at both ends |
| `FormationProgress` | `Domain/FormationProgress.cs` | a fraction of the window from 0 to 1, `NaN` and anything outside refused; `NotStarted` is the fraction a session with no run stands at; `IsWindowOver` is a full bar |

Application-layer ports (not Domain because they orchestrate cross-cutting
concerns):

| Interface | File | Implemented by |
|---|---|---|
| `IBroadcaster` | `Application/IBroadcaster.cs` | `SignalRBroadcaster` (Adapters.Web) |
| `IFacilitatorPassphrase` | `Application/Ports/Driven/IFacilitatorPassphrase.cs` | `FacilitatorPassphrase` (Host.Auth) |
| `IQuizCatalog` | `Application/Ports/Driven/IQuizCatalog.cs` | `QuizCatalogFile` (Host) |
| `IValuesCatalog` | `Application/Ports/Driven/IValuesCatalog.cs` | `ValuesCatalogFile` (Host) |
| `IAnimalsCatalog` | `Application/Ports/Driven/IAnimalsCatalog.cs` | `AnimalsCatalogFile` (Host) |
| `IGroupFormationProgress` | `Application/Formation/IGroupFormationProgress.cs` | `GroupFormationRunner` (Application) — driven by the three state mappers, which need the elapsed fraction (a `FormationProgress`, a Domain value object) and nothing else |

Application services:

| Service | File | Ports (ctor) | Lifetime | Called by |
|---|---|---|---|---|
| `GroupFormationRunner` | `Application/Formation/GroupFormationRunner.cs` | `IGroupSolver`, `IGroupNames`, `IRandomness`, `TimeProvider`, `GroupFormationWindow` (the Domain value object, tunable through `GROUP_FORMATION_WINDOW_MS`) | singleton | `GroupFormationService` (Adapters.Web hosted service, sibling of `StateResendService`) alone, on two beats: every 50 ms it pushes the progress of each session that has a run and applies the assignment once the window is over, and every 250 ms it scans for a connected session with no run that it finds unformed in phase 5. Only the slower scan reads the repository, so a room where nothing is forming costs no per-tick load. `WorkshopStateCache` is a cache and starts nothing |

`GroupFormationRunner` holds the one thing the domain must not hold: work in
flight. The solver call runs off-thread under a cancellation token the run
cancels when it is dropped, the elapsed time comes from `TimeProvider` and
goes straight to `GroupFormationWindow` to be read as progress, and the
window ends with the solver's assignment or, when it did not finish,
`RandomGroupAssignment` — pure domain either way
(`Domain/RandomGroupAssignment.cs`). A solve that returns after its run is
gone is discarded: each run carries a token its solve must still match.
Nothing about a run is persisted, so a restart mid-window just starts a new
one.

### 2.2 Frontend Ports

Port interfaces live in `src/domain/ports/`, sliced per role and concern:

| Interface | File | Purpose |
|---|---|---|
| `SessionStatePort<T>` | `src/domain/ports/sessionStatePort.ts` | Role-generic live state + connection state |
| `FacilitatorSessionStatePort` | `src/domain/ports/facilitator/sessionStatePort.ts` | Facilitator state stream |
| `FacilitatorLifecyclePort` | `src/domain/ports/facilitator/lifecyclePort.ts` | Facilitator intents (e.g. `advancePhase`) |
| `FacilitatorQuizControlPort` | `src/domain/ports/facilitator/quizControlPort.ts` | Quiz sub-controls (`revealAnswer`, `showLearningText`, `poseNextQuestion`) |
| `ParticipantQuizPort` | `src/domain/ports/participant/quizPort.ts` | Participant quiz answer (`chooseAnswer`) |
| `ParticipantSelectionPort` | `src/domain/ports/participant/selectionPort.ts` | Participant value selection (`submitSelection`) |
| `ParticipantGroupWorkPort` | `src/domain/ports/participant/groupWorkPort.ts` | Participant group work actions (`addAction`, `editAction`, `removeAction`, `submitGroupWork`, `reopenGroupWork`) |
| `FacilitatorGroupWorkControlPort` | `src/domain/ports/facilitator/groupWorkControlPort.ts` | Facilitator group work controls (`reassignScribe`) |
| `FacilitatorSessionCreationPort` | `src/domain/ports/facilitator/sessionCreationPort.ts` | Open a session over `POST /api/sessions` |
| `ParticipantSessionStatePort` | `src/domain/ports/participant/sessionStatePort.ts` | Participant state stream |
| `PresenterSessionStatePort` | `src/domain/ports/presenter/sessionStatePort.ts` | Presenter read-only state stream |

---

## 3. Per-Screen DI Contexts

`app/` splits into three screen groups, each with its own React context that
performs dependency injection of port implementations:

| Screen group | Directory | Context file | Injects |
|---|---|---|---|
| Facilitator | `src/app/facilitator/` | `dependencies.tsx` | `FacilitatorSessionStatePort`, `FacilitatorLifecyclePort`, `FacilitatorQuizControlPort`, `FacilitatorGroupWorkControlPort` |
| Participant | `src/app/participant/` | `dependencies.tsx` | `ParticipantSessionStatePort`, `ParticipantQuizPort`, `ParticipantSelectionPort`, `ParticipantGroupWorkPort` |
| Presenter | `src/app/presenter/` | `dependencies.tsx` | `PresenterSessionStatePort` |

**Rules:**
- Screens never import each other (`app/facilitator/` cannot import from
  `app/participant/` or `app/presenter/`)
- Screens never import concrete adapters directly — only via their DI context
- Session binding happens at the DI context level: adapters are constructed
  already bound to the session, so `sessionId` never threads through domain,
  UI, or port signatures

**Enforced by:** dependency-cruiser rules.

---

## 4. C# Type Decisions — Records by Default

Records are the default for all new C# types (AGENTS.md hard rule). A mutable
`class` requires written justification.

### 4.1 Value Objects → Records

| Type | Declaration | Rationale |
|---|---|---|
| `SessionIdentity` | `readonly record struct` | Value semantics, identity by value |
| `ParticipantId` | `readonly record struct` | Value semantics, identity by value |
| `ValueId` | `readonly record struct` | Value semantics, identity by value |
| `FacilitatorSubject` | `readonly record struct` | OIDC `sub` of the facilitator who opened the session |
| `CallerSubject` | `readonly record struct` | OIDC `sub` of whoever issues an intent, unverified until `Session.IsFacilitatedBy` compares it |
| `SessionName` | `readonly record struct` | Facilitator-chosen session name (≤ 120 chars) |

Future DTOs, commands, and events → records.

### 4.2 Aggregates, Building Blocks & In-Flight State → Mutable Sealed Classes

| Type | Declaration | Justification |
|---|---|---|
| `Session` | `sealed class` | Aggregate root. Routes commands to building blocks. Holds mutable composition of building blocks. Identity-based (each session is unique). |
| `Roster` | `sealed class` | Mutable participant collection. Enforces join/leave invariants. |
| `PhaseProgress` | `sealed class` | Mutable phase tracking. Enforces forward-only transitions. |
| `QuizProgress` | `sealed class` | Mutable question index, revealed state, tallies. |
| `SelectionRound` | `sealed class` | Mutable submission tracking + top-value computation. |
| `FormationRecord` | `sealed class` | Mutable group list. Populated by solver, persisted. |
| `PresentationWalk` | `sealed class` | Mutable presenting-group cursor. |
| `VotingRounds` | `sealed class` | Mutable vote tallies, tiebreak rounds. Anonymity invariant. |
| `Group` | `sealed class` | Mutable scribe assignment, submission state, actions collection. |
| `GroupFormationRunner` | `sealed class` | Not an aggregate — an application service running the group formations currently in flight: per run a token, a start timestamp, a `CancellationTokenSource` for its solve and, once the solver returns, its assignment. The mutation is inherently concurrent (a background solve writing while state mappers read), guarded by a single `Lock`; a record would have to be swapped atomically for no benefit. The state is memory-only and never persisted. |

**Common justification** (every row but the last): these types hold mutable
internal collections, enforce invariants through methods, and are composed
inside Session (identity-based, not value-based). Immutable record transitions
would require copying large nested structures on every state change with no
correctness benefit — the session is a single-writer aggregate.
`GroupFormationRunner` carries its own justification in the table: it is not
part of the aggregate at all.

---

## 5. Sealed by Default — Composition over Inheritance

All classes are `sealed` by default. Inheritance requires written
justification in this document.

There is no implementation inheritance in the backend. Shared contracts are
expressed as interfaces implemented by sealed records: `IPhaseExitGuard`
carries the `Phase` discriminator plus the `Refusal` / `IsSatisfiedBy`
contract, and `QuizExitGuard`, `GroupFormationExitGuard`, `GroupWorkExitGuard`,
`ValuePresentationExitGuard` and `FinalVotingExitGuard` implement it directly.
The guards are domain policy: the Domain-internal static class
`PhaseExitGuards` builds them per session (some guards, such as
`ValuePresentationExitGuard`, derive parameters from the session),
`Session.AdvancePhase()` consults it directly, and the facilitator
`enabledIntents` computation reads the same path — a single source.

**Rationale:** Sealed classes communicate "this is a leaf type — extend
behavior through composition, not subclassing." This prevents fragile base
class problems, makes the type hierarchy flat and predictable, and enables
the compiler to devirtualize calls.

**Enforced by:** Code review. ArchUnitNET could add a rule if needed.

---

## 6. Anti-God-Class Rule

No class may have more than **12 public methods**. This prevents domain types
from accumulating too many responsibilities.

- **Threshold:** 12 (user-approved; changes are Ask-first)
- **Enforced by:** ArchUnitNET rule in `Domain.Tests`
- **Scope:** All classes in all ValuesWorkshop assemblies

---

## 7. No Cyclic Dependencies

No cyclic dependencies between assemblies (BE) or modules (FE).

- **BE:** Enforced by ArchUnitNET `SlicesRuleDefinition` or manual cycle check
- **FE:** Enforced by dependency-cruiser `no-circular` rule
