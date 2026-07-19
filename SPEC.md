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
| Quality gates | Cyclomatic complexity: eslint `complexity` (FE), CA1502 as error (BE). Duplication: jscpd threshold over FE+BE. Formatting: Prettier check (TS/CSS), CSharpier check (C#). All deterministic. |
| CI/CD | GitHub Actions on PRs to `main`: build, unit tests, lint, arch tests, complexity, duplication, e2e. `main` protected — merge only on green pipeline. |
| Deploy | Local only: one-command `docker compose up` with seeded demo session. No public deploy. README gets GIF/screenshots of all three screens. |

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
   with as many votes as tied values (multi-votes allowed); repeat until 5
   values survive. Facilitator sub-control: start tiebreak round.
9. **Final presentation** — winning values+actions on presenter screen.
   Participant screen shows a download button: client-side PDF with all
   anonymous votes, all worked-out actions, and the winners.

## Screens

| Screen | Traits |
|---|---|
| Facilitator | Laptop. High information density, full session control, phase advancement, sub-controls, scribe reassignment, session creation (password-gated). |
| Presenter | Beamer, fullscreen, zero interactivity, unauthenticated. QR code, live charts, group presentations, final results. |
| Participant | Portrait mobile-first, easy interactivity; must also render well on landscape laptop screens. |

## Design System

- Fresh palette and typography (deliberately different from any prior work).
- Design tokens in one CSS file: color palette, typography hierarchy,
  multiple-of-4 spacing scale.
- stylelint enforces token usage (no raw hex/px outside the tokens file).

## Commands

To be finalized at scaffold time (then wired into no-mistakes
`commands.test` / `commands.lint`). Intended shape:

```
Dev:    docker compose up            # backend + frontend + dev OIDC + seed
FE:     pnpm --dir frontend dev | test | lint
BE:     dotnet run --project backend/src/... ; dotnet test backend
E2E:    pnpm --dir frontend e2e      # Playwright, multi-client
```

## Project Structure (intended)

```
frontend/          → Next.js app (3 screens), Jest unit tests, Playwright e2e
backend/           → ASP.NET Core solution, xUnit tests
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
- Hexagonal architecture both sides: pure domain core, ports in application
  layer, adapters (SignalR, SQLite, OR-Tools, OIDC, UI) at the edge;
  dependencies point inward only. Violations fail arch tests.
- Server-authoritative: clients send intents, server validates against phase
  rules and broadcasts state. Clients never compute authoritative results.
- Zod (or equivalent) validation of every inbound client message.
- Style examples added at scaffold time; kept minimal until then.

## Testing Strategy

- Unit: phase state machine, voting/tiebreak logic, CP-SAT wrapper (BE);
  components and reducers (FE).
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

- [ ] `docker compose up` → full workshop playable locally with seeded demo.
- [ ] Multi-client Playwright e2e passes: 9 phases end-to-end.
- [ ] Kill & restart backend mid-workshop → session resumes exactly.
- [ ] CP-SAT assignment returns within 3 s for 30 participants / ~10 values.
- [ ] Votes anonymous: no voter↔vote linkage in DB or PDF.
- [ ] PDF downloads in final phase with votes, actions, winners.
- [ ] stylelint fails on raw color/spacing values outside tokens file.
- [ ] de + en locales complete.
- [ ] PR pipeline runs all deterministic gates (build, tests, lint, format,
      arch, complexity, duplication, e2e); `main` merge blocked unless green.

## Open Questions

- None. PDF library (`@react-pdf/renderer`) and round-robin sizing rule
  decided in `tasks/plan.md`.
