# Implementation Plan: ValuesWorkshop

Source of truth: `SPEC.md`. Provenance rules: `CLEANROOM.md` (never consult the
old repository). This plan turns the spec into ordered, verifiable tasks.

## Overview

Real-time 9-phase workshop platform: Next.js frontend (facilitator, presenter,
participant screens), ASP.NET Core backend, SQLite persistence with full
restart recovery, SignalR real-time, OIDC auth (local `oidc-provider` for
dev/e2e, Azure AD prod), OR-Tools CP-SAT grouping, client-side PDF export.
Local docker compose only; merge gate via `git push no-mistakes <branch>` → PR
→ protected `main`.

## Architecture Decisions

Resolved here (were open in SPEC.md — SPEC.md updated alongside this plan):

1. **PDF library: `@react-pdf/renderer`.** Client-side rendering matches the
   spec requirement (participant downloads PDF in phase 9), React component
   model reuses existing i18n strings, no backend dependency.
2. **Round-robin group sizing rule.** For `N` participants:
   `G = max(1, floor(N / 4))` groups. Participants are counted round-robin
   into groups → group sizes are `floor(N / G)`, with the first `N mod G`
   groups getting one extra member. This guarantees every group has ≥ 4
   members (for N ≥ 4). Example: N=30 → G=7 → sizes 5,5,4,4,4,4,4.
   The same deal-out rule partitions the surviving values across the G groups
   (sizes `floor(V/G)`, first `V mod G` groups get +1). CP-SAT decides *which*
   participants and *which* values go to which group (maximizing
   Σ participants |own 10 selections ∩ group's values|); the sizing rule only
   fixes the cardinalities.

3. **Hexagonal architecture, arch-tested.** BE: `Domain` (pure) ←
   `Application` (use cases) ← `Adapters` (SignalR hub, SQLite/EF,
   OR-Tools, OIDC, HTTP). Ports live in `Domain`. FE: `domain/` (pure state logic, reducers, port interfaces) ←
   `adapters/` (SignalR client, API, PDF) ← `app/` (screens, DI wiring).
   Port interfaces live inside `domain/`; adapters implement them.
   Enforced by ArchUnitNET (BE, runs in xUnit) and dependency-cruiser (FE).
4. **Deterministic quality gates.** Cyclomatic complexity: eslint
   `complexity` rule (FE), CA1502 as error with `.editorconfig` threshold
   (BE). Duplication: jscpd over FE+BE sources with hard threshold.
   Formatting: Prettier `--check` (TS/CSS/MD), CSharpier `--check` (C#).
   Unit coverage: ≥ 80 % lines as hard gate, enforced per side — FE Jest
   `coverageThreshold`, BE coverlet line threshold.
   No heuristic/LLM gates in CI.
5. **Domain modeling before code (DDD).** Phase 0 produces the domain core
   only — ubiquitous language, domain events, commands, aggregates,
   invariants (DDD-workshop style, all technical detail stripped) plus the
   phase state machine and screen flows. Technical design docs are written
   just-in-time inside their implementing task: `architecture.md` (Task 4),
   `persistence.md` (Task 7), `protocol.md` (Task 9), `cpsat-model.md`
   (Task 17). No implementation code until the user approves Checkpoint 0.
   Design docs are living: deviations update the doc in the same PR.
6. **Frontend screen groups with dependency contexts.** `app/` splits into
   `facilitator/`, `participant/`, `presenter/`; each screen group wraps its
   tree in its own `<Role>DependencyContext` whose dependency graph is built
   once on screen-group entry. Session binding happens there: adapters are
   constructed already bound to the session, so no sessionId is threaded
   through domain, UI, or port signatures. Screens never import each other
   or concrete adapters (arch-tested).
7. **Backend test layout.** One xUnit test project per prod project
   (Domain/Application/Adapters/Host); prod solution contains prod projects
   only, tests live in a separate solution filter. Assertions use
   Shouldly (MIT, fully free), not bare xUnit `Assert.*` (from Task 4).
8. **E2e grows with the product.** The multi-client Playwright e2e is
   extended immediately after each workshop phase is implemented (regression
   protection from the start) — not written at the end. Phase F only
   hardens/deflakes it.
9. **Formatting: apply locally, check in CI.** Write-mode scripts +
   pre-commit hook apply Prettier/CSharpier locally; CI runs `--check` and
   fails loudly — CI never rewrites commits.
6. **CI/CD.** GitHub Actions workflow on PRs to `main` runs every
   deterministic gate (build, unit tests incl. ≥ 80 % line coverage
   thresholds, lint incl. stylelint, arch tests, complexity, duplication,
   Playwright e2e). Branch protection on `main`
   requires the pipeline check — no green, no merge. no-mistakes remains the
   local pre-PR gate.

Standing decisions (from SPEC.md, restated for build-time reference):

- Server-authoritative: clients send intents; server validates against the
  phase state machine and broadcasts state. No client-computed results.
- Persistence: every state mutation lands in SQLite before broadcast; restart
  = reload session state, clients reconnect and resync.
- Votes stored without voter identity (only "has voted" flags keyed by
  participant, tallies keyed by value).
- Design tokens: two-layer CSS custom properties + stylelint gate (see
  SPEC.md § Design System).

## Dependency Graph

```
Design docs (design/ — Phase 0, user-approved)
    │
Scaffold (hexagonal FE + BE + config/ + devtools/oidc + docker compose)
    │
    ├── Design tokens + stylelint gate
    ├── Arch tests (ArchUnitNET, dependency-cruiser)
    ├── Complexity + duplication gates
    ├── CI pipeline (PR → main, all gates) + branch protection
    ├── no-mistakes commands.test / commands.lint
    │
    ├── SQLite persistence layer ──┐
    ├── OIDC auth (dev provider) ──┤
    ├── SignalR hub + resync ──────┤
    │                              │
    │            Session core: create (PW-gated) / join / phase state machine
    │                              │
    │        ┌─────────────────────┼──────────────────────┐
    │   Phase 1 Join      Phase 2 Quiz          Phase 3+4 Selection/Results
    │        └─────────────────────┼──────────────────────┘
    │                              │
    │                   CP-SAT wrapper → Phase 5 Grouping
    │                              │
    │                   Phase 6 Group work → Phase 7 Presentation
    │                              │
    │                   Phase 8 Final vote (+tiebreak) → Phase 9 Results + PDF
    │                              │
    │            Reconnect + restart-recovery hardening
    │                              │
    │                   Full multi-client e2e, i18n completion, README media
```

## Task List

Task details (acceptance criteria, verification, files) live in
`tasks/todo.md`. Phases below are ordered; tasks within a phase are ordered.

### Phase 0: Domain Modeling / DDD (Tasks 0.1–0.3) — no code before Checkpoint 0

- [x] 0.1 Domain model, DDD-workshop style: ubiquitous language, domain
      events, commands + actors, aggregates, invariants — zero technical
      vocabulary (`design/domain-model.md`)
- [x] 0.2 Phase state machine (domain level): states, sub-states, guards,
      allowed actors, in ubiquitous language (`design/state-machine.md`)
- [x] 0.3 Screen flows: 3 screens × 9 phases matrix, low-fi wireframes,
      i18n-relevant states (`design/screens.md`)

### Checkpoint 0
- [x] Domain model + state machine + screen flows complete and consistent,
      reviewed and approved by user; merged to main. Only then Task 1.
      *(Approved via Lavish review of `tasks/checkpoint0-review.html`.)*

Technical design docs deferred just-in-time: `architecture.md` → Task 4,
`persistence.md` → Task 7, `protocol.md` → Task 9, `cpsat-model.md` → Task 17.

### Phase A: Foundation (Tasks 1–6)

- [x] 1. Scaffold monorepo with hexagonal skeletons: `frontend/` (Next.js,
      TS strict, Jest, `domain/adapters/app` layout; `app/` split into
      facilitator/participant/presenter screen groups, each with own React
      DI context), `backend/` (prod solution Domain/Application/Adapters/
      Host + one test project per prod project in separate test solution
      filter), `config/` (values catalog + quiz JSON stubs), `devtools/oidc/`.
- [x] 2. Design token files + stylelint enforcement (raw hex/px outside
      token files fails lint).
- [x] 3. `docker compose up`: FE + BE + dev OIDC + seeded demo session;
      agent-verifiable startup gate (`scripts/verify-startup.sh`: one command
      starts FE + BE, health-checked, exit 0/1).
- [x] 4. Architecture tests: write `design/architecture.md`, then
      ArchUnitNET rules (BE layer deps inward-only, god-class, no-cycles) +
      dependency-cruiser config (FE layers + screen-group isolation);
      Shouldly migration (all Assert.* → Shouldly); ports moved into domain.
- [x] 5. Complexity + duplication + formatting gates: eslint `complexity`
      (FE), CA1502 as error (BE), jscpd threshold over FE+BE, Prettier
      check (TS/CSS), CSharpier check (C#).
- [x] 6. CI/CD: GitHub Actions on PRs to `main` running all deterministic
      gates (build, tests, lint, arch, complexity, duplication, e2e);
      branch protection requires green check. Wire no-mistakes
      `commands.test` / `commands.lint` to the same commands.

### Checkpoint A
- [x] `docker compose up` serves all three apps; every gate proven by a
      deliberate violation (lint, arch, complexity, duplication, test);
      red PR cannot merge, green PR can.

### Phase B: Session Core (Tasks 7–11)

- [ ] 7. SQLite persistence layer: session store, write-before-broadcast,
      exact state reload on startup.
- [ ] 8. OIDC auth end-to-end against dev `oidc-provider`: BE token
      validation, FE login flow; presenter route unauthenticated.
- [ ] 9. SignalR hub: connect, join session group, server→client full-state
      resync message, client intent envelope with server-side validation.
- [ ] 10. Session lifecycle: facilitator-password-gated creation, participant
      join by `sessionId`, membership persistence, reconnect (facilitator +
      participant) restores role and state.
- [ ] 11. Phase state machine: 9 phases, forward-only, facilitator-only
      advance, sub-state hooks per phase; persisted.

### Checkpoint B
- [ ] E2E smoke: facilitator creates session, participant joins via OIDC,
      presenter shows session; kill+restart backend → all resume.

### Phase C: Workshop phases 1–4 (Tasks 12–16)

Phase batches C–E are review checkpoints only — work is one vertical slice
per workshop phase, and the multi-client e2e is extended immediately after
each workshop phase completes (regression protection from day one).

- [ ] 12. Phase 1 Join: presenter QR code (join URL), participant lobby,
      facilitator participant list + advance.
- [ ] 13. Quiz content in `config/` (5 questions × 3 answers + learning
      texts, de+en) + quiz phase backend logic (vote intake, one vote per
      participant per question, reveal, learning text, next question).
- [ ] 14. Quiz frontend: participant answer buttons, presenter live bar
      charts, facilitator sub-controls (next / reveal / learning text).
- [ ] 15. Phase 3 Selection: values catalog in `config/` (~50, de+en);
      participant selects exactly 10 (server-enforced, no duplicates).
- [ ] 16. Phase 4 Selection results: top-10 bar chart, ties at 10th place
      included, presenter + facilitator views.

### Checkpoint C
- [ ] E2E: phases 1–4 with facilitator + presenter + 3 participants.

### Phase D: Grouping + Group Work (Tasks 17–20)

- [ ] 17. CP-SAT wrapper (backend): sizing rule from this plan, assignment
      model (participants + values → groups), objective
      max Σ |own selections ∩ group values|, 3 s time cap with best
      incumbent, symmetry breaking on group labels; unit-tested.
- [ ] 18. Phase 5 Group selection: run solver on phase entry, animal-name
      group labels, results on all three screens, persisted.
- [ ] 19. Group work backend: random scribe per group, facilitator
      reassignment, actions CRUD (1–5 per value, scribe-only), submit /
      un-submit per group.
- [ ] 20. Group work frontend: scribe editor, read-only member view with
      live updates, facilitator overview + scribe reassignment.

### Checkpoint D
- [ ] E2E: phases 5–6 with 8 participants → 2 groups; solver < 3 s;
      scribe reassignment works.

### Phase E: Presentation + Voting + PDF (Tasks 21–24)

- [ ] 21. Phase 7 Value presentation: facilitator switches groups, presenter
      shows selected group's values + actions.
- [ ] 22. Final voting backend: 5 votes per participant, multi-votes on one
      value allowed, anonymous storage (no voter↔vote link), tie-at-5th
      detection, tiebreak rounds (votes = number of tied values, repeat
      until 5 survive), facilitator "start tiebreak" sub-control.
- [ ] 23. Final voting frontend: participant vote allocation UI, presenter
      live/hidden tallies per spec, facilitator controls.
- [ ] 24. Phase 9 Final presentation + PDF: winners on presenter,
      participant download button, `@react-pdf/renderer` document with all
      anonymous votes, all actions, winners; de+en.

### Checkpoint E
- [ ] E2E: phases 7–9 including one forced tiebreak round; PDF downloads
      and contains no voter identities.

### Phase F: Hardening + Polish (Tasks 25–28)

- [ ] 25. Restart-recovery + reconnect e2e coverage: kill backend in quiz,
      group work, and voting phases; tab-close/reopen for facilitator and
      participant.
- [ ] 26. i18n completeness pass: de+en for every screen, lint/test guard
      against missing keys.
- [ ] 27. Full multi-client Playwright e2e: facilitator + presenter +
      several participants through all 9 phases in one run (the SPEC.md
      success criterion).
- [ ] 28. README: setup, one-command demo, GIF/screenshots of all three
      screens; seeded demo session polish.

### Checkpoint F (Done)
- [ ] All SPEC.md success criteria checked off.

## Risks and Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| OR-Tools C# bindings friction in Docker (native libs) | High | Task 15 early spike inside the compose image; pin package version; fallback: greedy assignment behind same interface |
| SignalR + Next.js dev-server proxy/websocket quirks | Med | Prove in Task 7 smoke e2e before building phases on top |
| `oidc-provider` config drift vs Azure AD assumptions | Med | Keep auth behind one BE validation config; e2e only against dev provider; document Azure AD delta |
| Anonymity leak via logs/ordering | High | Task 20 unit test asserts no voter id in vote rows; review logging |
| Playwright multi-context flakiness (30 clients) | Med | E2e uses 3–8 participants; scale is a solver unit-test concern, not e2e |
| Restart recovery drift (state in memory not persisted) | High | Write-before-broadcast rule from Task 7 on; checkpoint B/F kill-tests |
| CA1502/jscpd thresholds too strict/lax early | Low | Set pragmatic initial thresholds in Task 5; tightening is Ask-first per SPEC.md |
| E2e in CI flaky → blocks all merges | Med | Small participant counts in CI e2e; retries=1; flake fixes are priority-0; e2e grows incrementally so flake sources surface early |

## Parallelization

- Sequential spine: A → B → (C, 17) → D → E → F.
- Task 17 (CP-SAT wrapper) is independent of Phase C — can run in parallel
  after Checkpoint B.
- Tasks 13/15 content JSON authoring parallel to any backend task.

## Open Questions

- None.

Decided (user-approved via Lavish review): `@react-pdf/renderer`; sizing
rule `G = max(1, floor(N/4))` round-robin; gate tooling ArchUnitNET /
dependency-cruiser / eslint complexity 10 / CA1502 10 / jscpd ≤2 %;
formatters Prettier + CSharpier (apply locally, check in CI); package
manager pnpm; overall plan incl. Phase 0 DDD-first approved.
