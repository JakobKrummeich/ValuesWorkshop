# Mini-Spec: Task 1 — Scaffold Monorepo (hexagonal skeletons)

**Objective:** Runnable, gate-ready skeletons for all four top-level parts —
`frontend/`, `backend/`, `config/`, `devtools/oidc/` — with the hexagonal
layout and anti-god-class Domain structure locked in from the first commit.
No feature logic; every later task builds inside this shape.

## Deliverables

### Layer mapping (both sides hexagonal, each idiomatic)

| Hexagon | FE | BE |
|---|---|---|
| Core: pure logic | `domain/` | `Domain` |
| Core: ports | `ports/` | `Application` (ports live inside) |
| Outside: adapters | `adapters/` | `Adapters` |
| Composition root / delivery | `app/<role>/` (Next.js App Router) | `Host` |

`domain/` + `ports/` are both the hexagon's *inside*; the folder split only
keeps dependency-cruiser rules trivial. Documented again in
`design/architecture.md` (Task 4).

### `frontend/` — Next.js, TypeScript strict, Jest, pnpm
- Layout: `src/{domain,ports,adapters,app}`; `app/` split into
  `facilitator/`, `participant/`, `presenter/` screen groups. Each group
  gets a `phases/` subdirectory (convention: one folder per workshop phase)
  with one placeholder phase folder now; real phase folders arrive with
  their tasks (12+).
- Each screen group wraps its tree in its own React context performing DI of
  port implementations (stub port + stub adapter + context per group, so the
  pattern is concrete, not a comment). Screens never import each other or
  concrete adapters (rule enforced by Task 4; structure laid here).
- Scripts: `dev` · `test` (Jest, ≥1 real test per layer stub) · `lint`
  (eslint; stylelint arrives Task 2).

### `backend/` — ASP.NET Core, nullable + warnings-as-errors
- Prod projects: `Domain`, `Application`, `Adapters`, `Host`.
  References encode direction only: Domain ← Application ← Adapters ← Host.
- `Application` ports split by role for the *driving* side —
  `Ports/Facilitator/`, `Ports/Participant/`, `Ports/Presenter/` (mirrors
  per-role screens + per-role snapshots, Task 9) — plus role-agnostic
  `Ports/Driven/` (persistence, solver, clock …). Folder skeleton here;
  rules firmed in `design/architecture.md` (Task 4).
- Test projects: `Domain.Tests`, `Application.Tests`, `Adapters.Tests`,
  `Host.Tests` (xUnit, ≥1 real test each).
- Solutions: `ValuesWorkshop.sln` prod-only; `ValuesWorkshop.Tests.slnf`
  adds the four test projects.
- `Domain` skeleton mirrors `design/domain-model.md`: `Session` root that
  **guards + routes only**; separate types for the building blocks —
  `Roster`, `WorkshopState`, `QuizProgress`, `SelectionRound`,
  `FormationRecord`, `PresentationWalk`, `VotingRounds` — plus `Group`
  aggregate. Skeleton bodies (types + minimal state), no phase rules yet.

### `config/` — content stubs, de+en fields throughout
- `values.json` (few sample values; full ~50 catalog in Task 15) ·
  `quiz.json` (1 sample question/answers/learning text; full set Task 13) ·
  `animals.json` (group names). Shape carries `de` + `en` per Phase 0 i18n
  note: value names, questions, answers, learning texts, animal names.

### `devtools/oidc/` — local `oidc-provider` package
- `node devtools/oidc` serves OIDC discovery document
  (`/.well-known/openid-configuration`). Client/user config comes Task 8.

## Success criteria
- [ ] `pnpm --dir frontend dev|test|lint` all run green
- [ ] `dotnet build backend/ValuesWorkshop.sln` green with **no** test
      projects built; `dotnet test backend/ValuesWorkshop.Tests.slnf` runs
      all 4 test projects green
- [ ] Project references encode dependency direction (verified by attempting
      a Domain→Adapters reference: build must not already have it)
- [ ] Each FE screen group has its own DI context; no cross-screen imports
- [ ] `curl` on oidc discovery endpoint returns valid JSON

## Slices

Each slice lands as its own commit(s) on the feature branch and leaves the
repo green. Order follows dependencies: BE has none, FE has none (parallel
in principle, sequential in practice), slice 3 needs both for the full
acceptance run.

### Slice 1a: Backend solution structure (S)
4 prod projects (`Domain`, `Application`, `Adapters`, `Host`) + 4 xUnit
test projects; `ValuesWorkshop.sln` prod-only, `ValuesWorkshop.Tests.slnf`
adds tests; nullable + warnings-as-errors in `Directory.Build.props`;
project refs Domain ← Application ← Adapters ← Host only; 1 placeholder
test per test project.
- [ ] `dotnet build backend/ValuesWorkshop.sln` green, builds no test project
- [ ] `dotnet test backend/ValuesWorkshop.Tests.slnf` runs 4 projects green
- [ ] `Domain.csproj` has zero `ProjectReference`s; direction verified

### Slice 1b: Typed Domain building blocks (S)
Session root (guards + routes only) + separate types: `Roster`,
`WorkshopState`, `QuizProgress`, `SelectionRound`, `FormationRecord`,
`PresentationWalk`, `VotingRounds`, `Group` aggregate. Skeleton bodies
(types + minimal state), no phase rules. `Application/Ports/` folders:
`Facilitator/`, `Participant/`, `Presenter/`, `Driven/` (skeleton only).
TDD applies: each type gets ≥1 real test (construction/initial state).
- [ ] Every domain-model.md building block exists as its own type
- [ ] Session contains no building-block rules (spot-check = god-class Never)
- [ ] Build + tests green

### Slice 2a: Frontend init + layers (S)
Next.js (pnpm, TS strict), Jest, eslint; `src/{domain,ports,adapters,app}`;
≥1 real test per layer stub.
- [ ] `pnpm --dir frontend dev|test|lint` all green
- [ ] No npm/yarn lockfile

### Slice 2b: Screen groups + DI contexts (S)
`app/{facilitator,participant,presenter}/` each with `phases/` placeholder
folder and own React context doing DI of a stub port + stub adapter
(pattern concrete per group).
- [ ] 3 contexts exist, each wires stub port impl; test per group
- [ ] No cross-screen-group imports; no concrete adapter imports in screens

### Slice 3: config + devtools/oidc + acceptance (S)
`config/values.json` (sample values), `quiz.json` (1 sample Q),
`animals.json` — all de+en fields; `devtools/oidc/` serving discovery doc;
top-level README pointers.
- [ ] `curl localhost:<port>/.well-known/openid-configuration` valid JSON
- [ ] Full Success-criteria list above runs green (final acceptance)

## Boundaries
- **Always:** pnpm only (no npm/yarn lockfiles) · TS strict · nullable +
  warnings-as-errors · test-first where logic exists (scaffold exception:
  generated code exempt).
- **Ask first:** any new runtime dependency beyond Next.js/Jest/eslint,
  ASP.NET Core/xUnit, `oidc-provider` · deviating from the layout above.
- **Never:** feature/phase logic · consult old repo (CLEANROOM.md) ·
  Session root containing building-block rules (god class).

## Decisions from Lavish review (user-approved)
- Ports stay a separate FE folder; `domain+ports` = hexagon core (mapping
  table above).
- `app/<role>/phases/` convention from the start.
- FE/BE keep idiomatic names; mapping table is the consistency contract.
- Class-size guardrail: custom ArchUnitNET rule (runs in `dotnet test`)
  "no class > 12 methods" + eslint `max-lines`/`max-statements` FE-side —
  implemented in Task 4, threshold changes Ask-first (recorded in todo.md).
- BE driving ports split facilitator/participant/presenter; driven ports
  role-agnostic.

## Open questions
- None — layout, pnpm, test split all user-approved (plan.md "Decided").
