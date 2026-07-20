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
1. `backend/`: prod projects + sln + slnf + test projects, empty-but-typed
   Domain building blocks, green build+test.
2. `frontend/`: Next.js init, layer folders, screen groups + DI contexts,
   green dev/test/lint.
3. `config/` stubs + `devtools/oidc/` + top-level README pointers; full
   acceptance run.

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
