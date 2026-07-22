# Architecture — ValuesWorkshop

Living document. Deviations discovered during implementation update this file
in the same PR (Ask-first).

---

## 1. Hexagonal Architecture

Both backend and frontend follow hexagonal (ports & adapters) architecture.
Dependencies point inward: outer layers depend on inner layers, never the
reverse. Ports (abstract interfaces) live inside the domain layer and are
implemented by adapters in the outer layer.

### 1.1 Backend Layers

```
Domain (pure logic + port interfaces)
  ↑
Application (use cases, orchestration)
  ↑
Adapters (implements ports: SignalR hub, SQLite/EF, OR-Tools, OIDC, HTTP)
  ↑
Host (composition root, DI wiring, startup)
```

| Layer | Assembly | Depends on | Contains |
|---|---|---|---|
| **Domain** | `ValuesWorkshop.Domain` | Nothing | Aggregates, value objects, domain events, port interfaces, invariants |
| **Application** | `ValuesWorkshop.Application` | Domain | Use cases, command handlers, application services |
| **Adapters** | `ValuesWorkshop.Adapters` | Application, Domain | Port implementations (persistence, messaging, external services) |
| **Host** | `ValuesWorkshop.Host` | Adapters (transitive: Application, Domain) | Composition root, DI registration, middleware, startup |

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

Port interfaces live in `ValuesWorkshop.Domain`. Adapters in
`ValuesWorkshop.Adapters` implement them. Application layer references port
interfaces from Domain to orchestrate use cases.

Current ports: none yet (Task 7+ will add persistence port, Task 9+ will add
messaging port).

### 2.2 Frontend Ports

Port interfaces live in `src/domain/`. Task 1 placeholders:

| Interface | File | Purpose |
|---|---|---|
| `FacilitatorGateway` | `src/domain/ports/facilitatorGateway.ts` | Facilitator session operations |
| `ParticipantGateway` | `src/domain/ports/participantGateway.ts` | Participant session operations |
| `PresenterGateway` | `src/domain/ports/presenterGateway.ts` | Presenter read-only stream |

Task 9 will slice these per concern (e.g., quiz control, formation control).

---

## 3. Per-Screen DI Contexts

`app/` splits into three screen groups, each with its own React context that
performs dependency injection of port implementations:

| Screen group | Directory | Context file | Injects |
|---|---|---|---|
| Facilitator | `src/app/facilitator/` | `dependencies.tsx` | `FacilitatorGateway` |
| Participant | `src/app/participant/` | `dependencies.tsx` | `ParticipantGateway` |
| Presenter | `src/app/presenter/` | `dependencies.tsx` | `PresenterGateway` |

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
| `ParticipantId` | `readonly record struct` | Value semantics, identity by value |
| `ValueId` | `readonly record struct` | Value semantics, identity by value |

Future DTOs, commands, and events → records.

### 4.2 Aggregates & Building Blocks → Mutable Sealed Classes

| Type | Declaration | Justification |
|---|---|---|
| `Session` | `sealed class` | Aggregate root. Routes commands to building blocks. Holds mutable composition of building blocks. Identity-based (each session is unique). |
| `Roster` | `sealed class` | Mutable participant collection. Enforces join/leave invariants. |
| `WorkshopState` | `sealed class` | Mutable phase + sub-state. Enforces forward-only transitions. |
| `QuizProgress` | `sealed class` | Mutable question index, revealed state, tallies. |
| `SelectionRound` | `sealed class` | Mutable submission tracking + top-value computation. |
| `FormationRecord` | `sealed class` | Mutable group list. Populated by solver, persisted. |
| `PresentationWalk` | `sealed class` | Mutable presenting-group cursor. |
| `VotingRounds` | `sealed class` | Mutable vote tallies, tiebreak rounds. Anonymity invariant. |
| `Group` | `sealed class` | Mutable scribe assignment, submission state, actions collection. |

**Common justification:** These types hold mutable internal collections,
enforce invariants through methods, and are composed inside Session
(identity-based, not value-based). Immutable record transitions would require
copying large nested structures on every state change with no correctness
benefit — the session is a single-writer aggregate.

---

## 5. Sealed by Default — Composition over Inheritance

All classes are `sealed` by default. Inheritance requires written
justification in this document (none currently).

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
