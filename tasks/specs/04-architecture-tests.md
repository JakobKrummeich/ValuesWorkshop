# Mini-Spec: Task 4 — Architecture Tests

## Objective

Establish `design/architecture.md` as the hexagonal architecture reference for
FE+BE, then enforce it with automated rules in the normal test/lint commands.
Convert BE tests to Shouldly. Convert skeleton `sealed class` building
blocks to the decided aggregate style.

## Deliverables

### 1. `design/architecture.md`

Living design doc covering:

- **Hexagonal map** — named layers, allowed dependency directions, both sides:
  - BE: `Domain` (pure + port interfaces) ← `Application` (use cases) ←
    `Adapters` (implements ports) ← `Host` (composition root). Domain depends
    on nothing; ports (abstract interfaces) live inside Domain and are
    implemented by Adapters.
  - FE: `domain/` (pure logic + port interfaces) ← `adapters/` (implements
    ports) ← `app/` (screens, DI wiring). Ports live inside `domain/`;
    adapters depend on `domain/` to implement its port interfaces. Domain
    depends on nothing.
- **Per-screen DI contexts** — `app/facilitator/`, `app/participant/`,
  `app/presenter/` each with own `dependencies.tsx`; screens never import each
  other or concrete adapters
- **Named ports** — port interfaces live in Domain (BE) / `domain/` (FE),
  not in a separate layer. Current Task-1 placeholders (`FacilitatorGateway`,
  `ParticipantGateway`, `PresenterGateway`) are in `ports/` — Task 4 moves
  them into `domain/` and removes the `ports/` directory. Task 9 will slice
  them per concern
- **C# records-by-default decision** — aggregate style chosen and justified:
  - Building blocks (Roster, WorkshopState, QuizProgress, SelectionRound,
    FormationRecord, PresentationWalk, VotingRounds) → **mutable classes**
    with justification: they hold internal mutable collections, enforce
    invariants through methods, and are composed inside Session (identity-based,
    not value-based). This is the aggregate style.
  - Value objects (ParticipantId, ValueId) → **records** (value semantics)
  - DTOs, commands, events (future) → **records**
  - Session root → **mutable class** (routes commands to building blocks)
  - Group → **mutable class** (has mutable Scribe/IsSubmitted + will hold
    actions collection)
  - Any remaining `class` has written justification in the doc
- **Anti-god-class rule** — max 12 methods per class, enforced by ArchUnitNET
  (threshold change Ask-first, user-approved in Task 1 Lavish review)

### 2. BE Architecture Tests — ArchUnitNET

Replace current `GetReferencedAssemblies()` placeholder tests in all 4 test
projects with proper ArchUnitNET rules.

**Package:** `TngTech.ArchUnitNET.xUnit` (latest stable) added to each
`*.Tests.csproj`.

**Rules** (in a shared `ArchitectureTests.cs` per test project, or a single
`ArchitectureRules.cs` in `Domain.Tests` covering all layers):

| Rule | Location |
|---|---|
| Domain depends on no other ValuesWorkshop assembly | Domain.Tests |
| Application depends only on Domain | Application.Tests |
| Adapters depends only on Application + Domain | Adapters.Tests |
| No adapter→adapter cross-concern references | Adapters.Tests |
| No class > 12 methods (anti-god-class) | Domain.Tests (scans all assemblies) |
| No cyclic dependencies between assemblies | Domain.Tests |

Deliberate violation test: a 13-method class must fail `dotnet test backend`.

### 3. FE Architecture Tests — dependency-cruiser

**Package:** `dependency-cruiser` added as devDep.

**Config:** `.dependency-cruiser.cjs` in `frontend/` with rules:
- `domain/` imports nothing app-internal (pure + port interfaces live here)
- `adapters/` imports only `domain/` (implements port interfaces)
- `app/*` screen groups import `domain/` and `adapters/` via DI context only,
  never each other (`app/facilitator/` cannot import from `app/participant/`
  or `app/presenter/`, etc.)
- No circular dependencies anywhere

**Wiring:** `pnpm --dir frontend lint` includes `depcruise` check (add script
to `package.json`).

Deliberate violation test: a `domain/`→`adapters/` import must fail
`pnpm --dir frontend lint`.

### 4. Shouldly Migration

**Package:** `Shouldly` (MIT license, fully free). Added to each `*.Tests.csproj`.

**Scope:** Convert all existing `Assert.*` xUnit calls (~30 occurrences across
Domain.Tests, Application.Tests, Adapters.Tests, Host.Tests) to Shouldly style:

| xUnit | Shouldly |
|---|---|
| `Assert.Equal(expected, actual)` | `actual.ShouldBe(expected)` |
| `Assert.Empty(collection)` | `collection.ShouldBeEmpty()` |
| `Assert.Null(value)` | `value.ShouldBeNull()` |
| `Assert.NotNull(value)` | `value.ShouldNotBeNull()` |
| `Assert.False(value)` | `value.ShouldBeFalse()` |
| `Assert.True(value)` | `value.ShouldBeTrue()` |
| `Assert.All(...)` | `collection.ShouldAllBe(...)` |
| `Assert.Contains(item, col)` | `col.ShouldContain(item)` |

Convention: every future BE test uses Shouldly. No `Assert.*` calls
remain after this task.

### 5. Aggregate Style Conversion

Convert Task-1 skeleton `sealed class` building blocks to decided style:
- `ParticipantId`, `ValueId` → already `record` ✓ (verify)
- `Session`, `Roster`, `WorkshopState`, `QuizProgress`, `SelectionRound`,
  `FormationRecord`, `PresentationWalk`, `VotingRounds`, `Group` → remain
  `sealed class` (justified: mutable internal state, identity-based
  aggregates/building blocks)
- Keep `sealed` — composition over inheritance is the default; inheritance
  needs written justification

Since these are already `sealed class` and the decided style is mutable class,
the main action is documenting the justification in `architecture.md`. No code
change needed unless any are incorrectly typed.

Verify `ParticipantId` and `ValueId` are records.

## Commands

```
# BE arch tests (ArchUnitNET) + all existing tests
dotnet test backend

# FE arch tests (dependency-cruiser) via lint
pnpm --dir frontend lint

# Full quality gate
./scripts/ci-lint.sh
./scripts/ci-test.sh
```

## Files Touched

```
design/architecture.md                          — NEW: hexagonal map + decisions
frontend/.dependency-cruiser.cjs                — NEW: FE arch rules
frontend/package.json                           — add dependency-cruiser, depcruise script
frontend/src/ports/ → frontend/src/domain/      — move port interfaces into domain/
frontend/src/adapters/                          — update imports from ports/ to domain/
frontend/src/app/*/dependencies.tsx              — update imports
backend/Domain.Tests/ArchitectureTests.cs       — replace with ArchUnitNET
backend/Application.Tests/ArchitectureTests.cs  — replace with ArchUnitNET
backend/Adapters.Tests/ArchitectureTests.cs     — replace with ArchUnitNET
backend/Host.Tests/ArchitectureTests.cs         — replace with ArchUnitNET
backend/Domain.Tests/*.csproj                   — add Shouldly + ArchUnitNET
backend/Application.Tests/*.csproj              — add Shouldly + ArchUnitNET
backend/Adapters.Tests/*.csproj                 — add Shouldly + ArchUnitNET
backend/Host.Tests/*.csproj                     — add Shouldly + ArchUnitNET
backend/Domain.Tests/SessionTests.cs            — Shouldly conversion
backend/Domain.Tests/WorkshopStateTests.cs      — Shouldly conversion
backend/Domain.Tests/RosterTests.cs             — Shouldly conversion
backend/Domain.Tests/GroupTests.cs              — Shouldly conversion
backend/Domain.Tests/QuizProgressTests.cs       — Shouldly conversion
backend/Domain.Tests/SelectionRoundTests.cs     — Shouldly conversion
backend/Domain.Tests/FormationRecordTests.cs    — Shouldly conversion
backend/Domain.Tests/PresentationWalkTests.cs   — Shouldly conversion
backend/Domain.Tests/VotingRoundsTests.cs       — Shouldly conversion
```

## Verification

1. `dotnet test backend` green — all ArchUnitNET rules pass
2. `pnpm --dir frontend lint` green — dependency-cruiser rules pass
3. Deliberate 13-method class → `dotnet test backend` fails → revert
4. Deliberate `Domain` → `Adapters` reference → `dotnet test backend` fails → revert
5. Deliberate `domain/` → `adapters/` import → `pnpm --dir frontend lint` fails → revert
6. `grep -r "Assert\." backend/*.Tests/ --include="*.cs" | grep -v obj/` → zero results (except `using` statements)
7. `./scripts/ci-lint.sh` green
8. `./scripts/ci-test.sh` green

---

## Implementation Steps

Ordered by dependency. Each step leaves system green.

### Step 1: `design/architecture.md` (XS — 1 new file)
Write hexagonal architecture reference doc.
- BE layers + dependency directions
- FE layers + dependency directions
- Ports-in-Domain decision (both sides)
- Per-screen DI contexts
- C# records-by-default + aggregate style justification
- Sealed + composition-over-inheritance default
- Anti-god-class rule (12 methods)
- No cyclic dependencies rule

**AC:** Doc covers all spec sections. No code changes.

### Step 2: Move FE ports into `domain/` (S — ~6 files)
- Move 3 gateway interfaces from `src/ports/` → `src/domain/`
- Update 3 adapter imports (`../ports/` → `../domain/`)
- Update 3 dependency context imports (`../../ports/` → `../../domain/`)
- Delete `src/ports/` directory
- Verify `pnpm --dir frontend build` + `pnpm --dir frontend lint` green

**AC:** `ports/` directory gone. Build + lint green.

### Step 3: Add Shouldly + ArchUnitNET packages (XS — 4 .csproj files)
- Add `Shouldly` to all 4 test .csproj files
- Add `TngTech.ArchUnitNET.xUnit` to all 4 test .csproj files
- `dotnet restore` + `dotnet build` green

**AC:** Packages restore. Build green.

### Step 4: Convert `Assert.*` to Shouldly (S — ~10 test files)
- Convert all ~30 `Assert.*` calls to Shouldly equivalents
- Remove `using Xunit` global using where only Shouldly needed (keep xUnit `[Fact]`)
- `dotnet test backend` green

**AC:** `grep -r "Assert\." backend/*.Tests/ --include="*.cs" | grep -v obj/ | grep -v "using"` → zero results.

### Step 5: Replace BE arch tests with ArchUnitNET (M — 4 test files)
Replace all 4 `ArchitectureTests.cs` with ArchUnitNET rules:
- `Domain.Tests`: Domain depends on no VW assembly, no cyclic deps, no >12 methods
- `Application.Tests`: depends only on Domain
- `Adapters.Tests`: depends only on Application+Domain, no cross-adapter
- `Host.Tests`: is executable composition root (keep existing check, convert to Shouldly)
- `dotnet test backend` green

**AC:** All ArchUnitNET rules pass. Deliberate 13-method class fails.

### Step 6: Install dependency-cruiser + config (S — 3 files)
- `pnpm --dir frontend add -D dependency-cruiser`
- Create `frontend/.dependency-cruiser.cjs` with rules:
  - `domain/` imports nothing app-internal
  - `adapters/` imports only `domain/`
  - `app/*` screens never import each other
  - No circular dependencies
- Wire `depcruise` into `pnpm --dir frontend lint`
- `pnpm --dir frontend lint` green

**AC:** Lint passes. Deliberate `domain/`→`adapters/` import fails lint.

### Step 7: Full verification (XS)
- `./scripts/ci-lint.sh` green
- `./scripts/ci-test.sh` green
- Deliberate violations (3): 13-method class, Domain→Adapters ref, domain→adapters import
- Each violation fails respective gate → revert

**AC:** All gates green. All 3 deliberate violations caught.

### Checkpoint
- [ ] `design/architecture.md` complete
- [ ] FE `ports/` eliminated, port interfaces in `domain/`
- [ ] Zero `Assert.*` in BE tests
- [ ] ArchUnitNET rules enforced (layer deps, god-class, cyclic)
- [ ] dependency-cruiser rules enforced (FE layer + screen isolation)
- [ ] All quality gates green

---

## Boundaries

- **Always:** rules run in normal test/lint commands (no separate invocation)
- **Ask first:** threshold changes (12 methods, complexity 7)
- **Never:** weaken sealed-by-default or composition-over-inheritance without justification

## Open Questions

None.
