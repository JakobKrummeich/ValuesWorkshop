# Spec: ValuesWorkshop

Real-time workshop platform: ~30 participants, one facilitator, one projector,
2 hours, working out company values and — most importantly — pragmatic
every-workday **actions** connected to each value.

Clean-room rebuild from memory. See `CLEANROOM.md` for provenance rules.

## Objective

- A facilitator runs a structured 9-phase workshop with up to ~30 participants.
- Participants join via QR code on their phones, authenticate via OIDC, and
  interact in real time (quiz votes, value selection, group work, final voting).
- The projector (presenter screen) shows live, non-interactive visualizations.
- All phase results persist; later phases build on earlier ones. A server
  restart mid-workshop loses nothing.
- Output: a PDF each participant can download in the final phase — all
  (anonymous) votes, all worked-out actions, and the winning values+actions.

Success = a full workshop can be run end-to-end locally (docker compose),
verified by a multi-client Playwright e2e test.

## Tech Stack

| Concern | Choice |
|---|---|
| Frontend | Next.js (React, TypeScript strict) |
| Backend | C# ASP.NET Core |
| Persistence | SQLite — full session state, exact resume after restart |
| Real-time | SignalR (WebSockets), server-authoritative state |
| Auth | OIDC. Prod: Azure AD. Dev/e2e: local `oidc-provider` (npm) instance |
| Optimization | Google OR-Tools CP-SAT (C# bindings) for group/value assignment |
| PDF | Client-side: `@react-pdf/renderer` |
| Unit tests FE | Jest |
| Unit tests BE | xUnit |
| E2E | Playwright, multi-browser-context (facilitator + presenter + N participants) |
| Styling | Plain CSS with design tokens, token usage enforced by stylelint |
| i18n | de + en |
| Architecture | Hexagonal (ports & adapters) in FE and BE, enforced by arch tests: ArchUnitNET (BE), dependency-cruiser (FE) |
| Quality gates | Cyclomatic complexity: eslint `complexity` (FE), CA1502 as error (BE). Duplication: jscpd threshold over FE+BE. Formatting: Prettier check (TS/CSS), CSharpier check (C#). Unit coverage: ≥ 80 % lines, FE (Jest `coverageThreshold`) and BE (coverlet threshold) each — hard gate. All deterministic. |
| CI/CD | GitHub Actions on PRs to `main`: build, unit tests, lint, arch tests, complexity, duplication, coverage (≥ 80 % lines FE+BE), e2e. `main` protected — merge only on green pipeline. |
| Deploy | Local only: one-command `docker compose up` with seeded demo content (bilingual values/quiz/animals catalogs, 31 dev OIDC accounts); the facilitator opens the session in the UI. No public deploy. README gets screenshots of all three screens. |

## Domain Model

### Sessions
- Multiple sessions supported; every participant joins a specific `sessionId`.
- Only the facilitator can create sessions; creation requires a facilitator
  password set on the server (participants never have it).
- Facilitator and participants authenticate via OIDC. Presenter screen is
  unauthenticated (URL contains sessionId).
- Reconnect mechanism for facilitator and participants — closing a tab must
  not lose control of / membership in the session.
- Exact per-session state persisted on disk; full recovery after restart.

### Content
- Values catalog (~50 values) and quiz content (questions, answers, learning
  texts): server config / JSON. Not editable per session.

### Phases (forward-only; facilitator advances)

1. **Join** — presenter shows large QR code; participants scan, log in via
   OIDC, land in a lobby. Facilitator advances when ready.
2. **Quiz** — 5 questions about values in a work context. 3 answers each:
   one correct, one wrong, one funny-wrong. One question at a time. Live
   bar charts move as votes arrive. Facilitator sub-controls: next question,
   reveal correct answer, show per-question learning text.
3. **Selection** — each participant selects exactly 10 values from the
   catalog; no multiple votes per value.
4. **Selection results** — bar chart of the top-10 most-selected values;
   more than 10 shown if tied at 10th place.
5. **Group selection** — participants split into groups of ≥4 (group
   count/sizes via round-robin sizing: `G = max(1, floor(N/4))` groups,
   sizes `floor(N/G)` with first `N mod G` groups getting +1; same deal-out
   rule sizes the value partition). Surviving values distributed evenly
   across groups. CP-SAT assigns participants and values to groups,
   maximizing Σ over participants of |own 10 selections ∩ group's values|.
   Solver time-boxed to 3 s; best incumbent taken. Solver setup exploits
   inherent symmetries (group-label permutation invariance). User-facing
   group labels: animal names.
6. **Group work** — one random participant per group is the **scribe**
   (facilitator can reassign, e.g. dead phone). Group works out 1–5
   work-related, everyday, pragmatic actions per assigned value. Only the
   scribe can enter, submit, un-submit, and edit.
7. **Value presentation** — each group's actions shown on the presenter
   screen; facilitator switches between groups.
8. **Final voting** — each participant has 5 votes across all presented
   values+actions; multi-votes allowed (up to 5 on one value). Secret and
   anonymous. Tie at 5th place → tiebreaker round among tied values only,
   with as many votes as winner places still open (multi-votes allowed);
   repeat until 5 values survive. Facilitator sub-control: start tiebreak
   round.
9. **Final presentation** — winning values+actions on presenter screen.
   Participant screen shows a download button: client-side PDF with all
   anonymous votes, all worked-out actions, and the winners.

## Screens

| Screen | Traits |
|---|---|
| Facilitator | Laptop. High information density, full session control, phase advancement, sub-controls, scribe reassignment, session creation (password-gated). |
| Presenter | Beamer, fullscreen, zero interactivity, unauthenticated. QR code, live charts, group presentations, final results. |
| Participant | Portrait mobile-first, easy interactivity; must also render well on landscape laptop screens. |

Participant attention rule: the participant device never mirrors presenter or
beamer content. Whenever a participant has no pending input, their device
shows either the calm waiting screen (aurora motif with a short phase-aware
caption; see `design/visual-system.md` §6) or a minimal confirmation of their
own submission
— the room's attention belongs up front, not on the phone.

## Design System

- Fresh palette and typography (deliberately different from any prior work).
- Two-layer CSS custom-property system: base primitives (`--base-*`) in
  `tokens.css`, semantic aliases (`--color-*`, `--text-*`, `--space-*`, etc.)
  scoped per screen in `tokens.{facilitator,participant,presenter}.css`.
  Color palette, typography hierarchy, multiple-of-4 spacing scale.
- stylelint enforces token usage (no raw hex/px outside token files,
  no `--base-*` references outside token files).

## Commands

See `README.md` (root) for current dev/build/test/lint commands.
CI wiring: `commands.test` / `commands.lint` (Task 6).

## Project Structure

```
frontend/          → Next.js app (3 screens), Jest unit tests
backend/           → ASP.NET Core solution, xUnit tests
e2e/               → Playwright end-to-end tests
config/            → values catalog + quiz content JSON
devtools/oidc/     → local oidc-provider server for dev + e2e
design/            → design models. DDD domain core (domain model, state
                     machine, screen flows) written and user-approved before
                     any implementation code; technical docs (architecture,
                     persistence, protocol, CP-SAT) written just-in-time in
                     their implementing task
tasks/             → plan.md, todo.md (spec-driven workflow)
```

## Code Style

- TypeScript strict; C# nullable-enabled, warnings as errors.
- Hexagonal architecture both sides: pure domain core with port interfaces,
  adapters (SignalR, SQLite, OR-Tools, OIDC, UI) at the edge;
  dependencies point inward only. Violations fail arch tests.
  Layer details and decisions: `design/architecture.md`.
- Server-authoritative: clients send intents, server validates against phase
  rules and broadcasts state. Clients never compute authoritative results.
- Session binding at the edge: the per-screen-group dependency context builds
  its dependency graph on screen entry with adapters already bound to the
  session; sessionId never appears in domain logic, UI props, or port
  signatures (edge-only concern).
- Zod (or equivalent) validation of every inbound client message.
- Style examples added at scaffold time; kept minimal until then.

## Testing Strategy

- Unit: phase state machine, voting/tiebreak logic, CP-SAT wrapper (BE);
  components and reducers (FE).
- Coverage guardrail: ≥ 80 % line unit coverage, enforced separately for FE
  (Jest `coverageThreshold`) and BE (coverlet line threshold); below-threshold
  fails test command locally and in CI.
- E2E: Playwright with multiple browser contexts simulating facilitator,
  presenter, and several participants through all 9 phases, including
  restart-recovery and reconnect. Dev OIDC server makes login testable.
- Merge gate: `git push no-mistakes <branch>` (review + tests + lint), then
  PR to protected `main`.

## Boundaries

- **Always:** run tests before push; keep spec updated when decisions change;
  validate all client input server-side; keep votes anonymous in storage.
- **Ask first:** new dependencies, schema changes, CI changes, deviating
  from this spec.
- **Never:** look at the old repository or any artifact of it (CLEANROOM.md);
  commit secrets; weaken the merge gate; store voter identity with votes.

## Success Criteria

- [x] `docker compose up` → full workshop playable locally with seeded demo
      content — README "Run the demo", verified by a fresh-clone dry run
      (Task 28).
- [x] Multi-client Playwright e2e passes: 9 phases end-to-end —
      `e2e/workshopAtScale.spec.ts` (30 participants, tiebreak, PDF), three
      consecutive green runs recorded in Task 27.
- [x] Kill & restart backend mid-workshop → session resumes exactly —
      `e2e/restartRecovery.spec.ts` restarts the container mid-quiz,
      mid-group-work, mid-voting, and mid-reveal.
- [x] CP-SAT assignment returns within 3 s for 30 participants / ~10 values —
      `CpSatGroupSolverTests.Thirty_participants_solve_within_three_seconds`.
- [x] Votes anonymous: no voter↔vote linkage in DB or PDF —
      `VotingAnonymityTests.No_vote_table_carries_a_participant_column`
      (`voted_participants` records only who has voted, never what); the
      at-scale e2e asserts no participant name in the PDF text.
- [x] PDF downloads in final phase with votes, actions, winners — at-scale
      e2e parses the download and asserts winners, all actions, votes per
      round.
- [x] stylelint fails on raw color/spacing values outside token files —
      `frontend/stylelint.config.mjs` (`declaration-strict-value`,
      `color-no-hex`, `unit-disallowed-list`; `tokens*.css` exempt).
- [x] de + en locales complete — `Record<MessageKey, Message>` fails the FE
      build on a missing key or language; `translate.test.ts`; backend
      catalog tests require both locales per shipped entry; locale flip
      pinned by `e2e/localeFlip.spec.ts`.
- [x] PR pipeline runs all deterministic gates (build, tests, lint, format,
      arch, complexity, duplication, coverage ≥ 80 % lines FE+BE, e2e);
      `main` merge blocked unless green — `.github/workflows/ci.yml` job
      `ci`: FE lint (eslint `complexity` 7, stylelint, Prettier, tsc,
      dependency-cruiser, audit), FE build, Jest with coverage threshold,
      BE build with analyzers (VW1001 complexity, ArchUnitNET in tests),
      CSharpier, coverlet threshold, vulnerability scan, jscpd; job `e2e`:
      `scripts/ci-e2e.sh`. `scripts/ci-lint.sh` and `scripts/ci-test.sh`
      mirror them locally. The `main` ruleset requires a pull request with
      one approval and the `ci` status check, strict (up to date with
      `main`); the `e2e` job runs on every PR but is not a required check.

## Open Questions

- None. PDF library (`@react-pdf/renderer`) and round-robin sizing rule
  decided in `tasks/plan.md`.
