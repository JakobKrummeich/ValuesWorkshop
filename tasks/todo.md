# ValuesWorkshop — Task List

Per-task workflow: skill chain in `AGENTS.md` (root).

Ordered per `tasks/plan.md`. Every task: TDD (test first), spec is
`SPEC.md`, never consult the old repo (`CLEANROOM.md`). Merge gate:
feature branch → `git push no-mistakes <branch>` → PR → protected `main`
(CI pipeline must be green to merge).

Definition of Done (every task): tests pass, lint clean, arch tests green,
complexity + duplication gates green, unit line coverage ≥ 80 % (FE and BE
each), builds green, SPEC.md updated if a decision changed, no secrets
committed.

---

## Phase 0: Domain Modeling (DDD) — no implementation code before Checkpoint 0

Domain language is the core; all technical detail stripped. Technical design
docs (protocol, persistence, architecture map, CP-SAT model) are written
just-in-time inside the task that implements them — not here. All artifacts:
markdown + Mermaid in `design/`, living documents (deviation → update doc in
same PR, Ask-first).

### Task 0.1: Domain model — DDD-workshop style ✅
**Description:** `design/domain-model.md`: ubiquitous language glossary
(de/en terms the facilitator would use), domain events per workshop phase
(event-storming style: ParticipantJoined, QuizAnswerCast, ValuesSelected,
GroupsFormed, ActionsSubmitted, TiebreakStarted, …), commands and their
actors, aggregates with boundaries and ownership (Session root; Group;
vote tallies as anonymous read models), and invariants (exactly-10
selection, 1–5 actions per value, 5 final votes, one scribe per group,
vote anonymity, forward-only phases). No table names, no transport, no
framework words.
**Acceptance criteria:**
- [x] Every SPEC.md noun mapped to a term in the glossary or explicitly
      excluded
- [x] Every invariant assigned to exactly one aggregate that enforces it
- [x] Domain events cover all 9 phases; commands name their actor
- [x] Zero technical vocabulary (no SQL/SignalR/HTTP/React terms)
**Verification:** cross-read against SPEC.md; a domain expert could review
this without knowing the stack.
**Dependencies:** None. **Size:** M

### Task 0.2: Phase state machine (domain level) ✅
**Description:** `design/state-machine.md`: Mermaid stateDiagram of 9 phases
(forward-only) + per-phase sub-states (quiz question index / revealed /
learning-text, presenting group, tiebreak round), guards, and allowed actor
per transition (facilitator/participant/system). Expressed in ubiquitous
language from 0.1.
**Acceptance criteria:**
- [x] Every facilitator sub-control from SPEC.md appears as a transition
- [x] No transition lacks an actor + guard
- [x] Transitions consume commands / emit events from 0.1
**Verification:** walk all 9 phases against SPEC.md; no dead ends.
**Dependencies:** 0.1. **Size:** S

### Task 0.3: Screen flows ✅
**Description:** `design/screens.md`: 3 screens × 9 phases matrix (what each
role sees/can do per phase), low-fi wireframes (ASCII/Mermaid) for key
screens (join QR, quiz bars, selection grid, group work editor, voting,
final + PDF button), portrait-mobile-first notes, i18n-visible states.
**Acceptance criteria:**
- [x] All 27 matrix cells filled (or marked intentionally empty)
- [x] Every command from 0.1 reachable from some wireframe element
**Verification:** cross-check matrix against SPEC.md screens table + 0.1.
**Dependencies:** 0.1, 0.2. **Size:** M

### Checkpoint 0 — gate for ALL code ✅
- [x] Domain model, state machine, screen flows complete and consistent
- [x] User reviewed and approved (DDD depth is the review focus — approved
      via Lavish review of `tasks/checkpoint0-review.html`)
- [x] Merged to main; Task 1 may start

Deferred technical design docs (written inside their implementing task):
`design/architecture.md` → Task 4 · `design/persistence.md` → Task 7 ·
`design/protocol.md` → Task 9 · `design/cpsat-model.md` → Task 17.

---

## Phase A: Foundation

### Task 1: Scaffold monorepo (hexagonal skeletons)
**Description:** Create `frontend/` (Next.js, TypeScript strict, Jest) with
hexagonal layout `src/{domain,ports,adapters,app}` where `app/` splits into
the three screen groups `facilitator/`, `participant/`, `presenter/` — each
wrapped in its own React context that performs dependency injection of port
implementations (screens never import each other or concrete adapters).
`backend/` ASP.NET Core with `Domain`, `Application`, `Adapters`, `Host`
prod projects (nullable, warnings as errors) and **one xUnit test project
per prod project** (`Domain.Tests`, `Application.Tests`, `Adapters.Tests`,
`Host.Tests`); prod solution contains only prod projects, tests live in a
separate solution/filter (`ValuesWorkshop.sln` prod-only,
`ValuesWorkshop.Tests.slnf` adds tests). `config/` (values catalog + quiz
JSON stubs — de+en fields per Phase 0 i18n note: value names, questions,
answers, learning texts, animal names); `devtools/oidc/` (local
`oidc-provider` server package). Package manager: pnpm (user-approved).
BE `Domain` skeleton mirrors `design/domain-model.md`: Session root that
guards + routes only; building blocks (Roster, Workshop state, Quiz
progress, Selection round, Formation record, Presentation walk, Voting
rounds) and Group aggregate as separate types — anti-god-class guardrail
from the first commit.
**Acceptance criteria:**
- [ ] FE `dev|test|lint` scripts all run
- [ ] `dotnet build` (prod sln, no test projects) and `dotnet test`
      (test filter, all 4 test projects) both green
- [ ] Project references encode direction: Domain ← Application ← Adapters ← Host
- [ ] Each screen group has its own DI context; cross-screen import fails
      arch rules (Task 4)
- [ ] `node devtools/oidc` serves OIDC discovery document
**Verification:** run the commands above; hit
`/.well-known/openid-configuration`.
**Dependencies:** None. **Size:** L (scaffold exception — generated code)

### Task 2: Design tokens + stylelint gate
**Description:** One `tokens.css` with fresh palette, typography hierarchy,
multiple-of-4 spacing scale. stylelint config rejects raw hex/px outside the
tokens file.
**Acceptance criteria:**
- [ ] All FE styles reference tokens only
- [ ] Deliberate raw `#fff` in a component file fails `pnpm --dir frontend lint`
**Verification:** lint pass + deliberate-violation fail (then revert).
**Dependencies:** 1. **Size:** S

### Task 3: docker compose
**Description:** `docker compose up` starts backend, frontend, dev OIDC;
seeds one demo session.
Additionally an agent-verifiable smoke-start gate: `scripts/smoke.sh` starts
frontend and backend each with one simple command, polls their health/root
endpoints until HTTP 200 (bounded timeout), exits 0/1 — runnable by an agent
and by CI.
**Acceptance criteria:**
- [ ] One command, all three reachable from host
- [ ] Seeded demo session exists in SQLite volume
- [ ] OR-Tools native libs load inside backend image (early spike for Task 17)
- [ ] `scripts/smoke.sh` exits 0 when both apps start, non-zero when broken
**Verification:** fresh `docker compose up`, curl each service, check seed,
run `scripts/smoke.sh` twice (healthy → 0; with sabotaged start → 1).
**Dependencies:** 1. **Size:** M

### Task 4: Architecture tests
**Description:** First write `design/architecture.md` (hexagonal map FE+BE:
named ports, adapters, dependency directions, per-screen DI contexts), then
derive rules 1:1. BE: ArchUnitNET rules in xUnit — Domain depends on
nothing, Application only on Domain, Adapters only on Application/Domain,
no adapter→adapter references across concerns; custom class-size rule —
no class > 12 methods (anti-god-class, user-approved via Task 1 Lavish
review; threshold changes Ask-first). FE: dependency-cruiser —
`domain/` imports nothing app-internal, `ports/` only domain, `adapters/`
only ports/domain, `app/*` screen groups import via ports/contexts only and
never each other; no circular deps anywhere; eslint `max-lines`/
`max-statements` as FE class-size counterpart.
BE assertion style (user feedback on Task 1 PR): adopt FluentAssertions
(`result.Should().BeNull()` style) — add package, convert all existing
`Assert.*` xUnit tests, convention for every future BE test. Pin a
free-license version line (v7.x Apache-2.0; v8+ needs paid commercial
license — version bump is Ask-first).
**Acceptance criteria (added from Task 1 review):**
- [ ] Deliberate 13-method class fails `dotnet test backend` (then revert)
- [ ] No `Assert.*` calls remain in BE test projects; FluentAssertions
      used throughout
**Acceptance criteria:**
- [ ] Deliberate Domain→Adapters reference fails `dotnet test backend`
- [ ] Deliberate `domain/`→`adapters/` import fails `pnpm --dir frontend lint`
- [ ] Rules run in normal test/lint commands (no separate invocation)
**Verification:** green run + one deliberate violation per side (then revert).
**Dependencies:** 1. **Size:** S

### Task 5: Complexity + duplication + formatting gates
**Description:** Deterministic gates. FE: eslint `complexity` rule (error).
BE: CA1502 severity=error, threshold via `.editorconfig`
(`Microsoft.CodeAnalysis.NetAnalyzers`). Duplication: `jscpd` over
`frontend/src` + `backend/src` with hard threshold, wired into lint command.
Formatting: Prettier + CSharpier — local workflow *applies* formatting
(write-mode scripts + pre-commit hook), CI runs `--check` only (CI must fail
loudly, never silently rewrite commits).
Coverage: ≥ 80 % line unit coverage as hard gate on each side — FE: Jest
`coverageThreshold` (lines: 80) in test command; BE: coverlet
(`coverlet.msbuild`, `/p:Threshold=80 /p:ThresholdType=line`) in test command.
Initial thresholds: complexity 10 (both sides), jscpd ≤ 2 % / min-tokens 50,
coverage 80 % lines.
**Acceptance criteria:**
- [ ] Deliberately complex function fails FE lint and BE build respectively
- [ ] Deliberate copy-pasted block fails jscpd gate
- [ ] Deliberately misformatted TS and C# file each fail lint command
- [ ] Deliberately uncovered code below 80 % lines fails FE and BE test
      commands respectively
- [ ] Thresholds documented in this file + config; changes are Ask-first
**Verification:** green run + one deliberate violation per gate (then revert).
**Dependencies:** 1. **Size:** S

### Task 6: CI/CD pipeline + branch protection + no-mistakes wiring
**Description:** GitHub Actions workflow triggered on PRs to `main`: FE+BE
build, unit tests (incl. ≥ 80 % line coverage thresholds), eslint+stylelint,
arch tests, CA1502 (via build), jscpd, Playwright e2e (compose-based). Branch protection on `main`: required status
check = pipeline, no direct pushes. Set no-mistakes `commands.test` /
`commands.lint` to the same commands CI runs.
**Acceptance criteria:**
- [ ] PR with failing gate shows red check and cannot be merged
- [ ] PR with all gates green can be merged; direct push to `main` rejected
- [ ] `git push no-mistakes <branch>` runs same test/lint commands locally
- [ ] CI and no-mistakes invoke identical scripts (single source of truth)
**Verification:** two throwaway PRs (one red, one green); attempt direct push.
**Dependencies:** 1–5. **Size:** M

### Checkpoint A
- [ ] compose up serves all apps; every gate proven by deliberate violation
      (test, lint, arch, complexity, duplication, coverage); red PR blocked,
      green PR merges; PR merged to main

---

## Phase B: Session Core

### Task 7: SQLite persistence layer
**Description:** First write `design/persistence.md` (tables, keys,
write-before-broadcast flow, recovery procedure, schema-level anonymity
argument), then implement: session store (adapter behind Application port),
every state mutation persisted before broadcast; on startup, all sessions
reload to exact prior state.
**Acceptance criteria:**
- [ ] `design/persistence.md` written; no voter↔vote linkage possible by
      schema
- [ ] Write-before-broadcast enforced in one code path (no ad-hoc saves)
- [ ] Round-trip test: mutate → new store instance → identical state
**Verification:** `dotnet test backend` (persistence round-trip suite).
**Dependencies:** 1. **Files:** `backend/src/Adapters/Persistence/*`. **Size:** M

### Task 8: OIDC auth end-to-end
**Description:** BE validates tokens from dev `oidc-provider`; FE login
redirect flow for facilitator + participant; presenter route unauthenticated.
**Acceptance criteria:**
- [ ] Unauthenticated API/hub access rejected (except presenter endpoints)
- [ ] Playwright: scripted login against dev provider reaches app
- [ ] Provider config (authority/audience) is environment-driven (Azure AD prod)
**Verification:** BE authz unit tests + one Playwright login smoke.
**Dependencies:** 1, 3. **Size:** M

### Task 9: SignalR hub + resync protocol
**Description:** First write `design/protocol.md` (intent/event catalog with
payload schemas, per-role snapshots — no anonymity leaks by schema —, error
model, sequence diagrams for join/vote/reconnect/restart/tiebreak; the FE/BE
contract). Then implement: hub (adapter) with session groups; client intent
envelope validated server-side; full-state snapshot on connect/reconnect.
**Acceptance criteria:**
- [ ] `design/protocol.md` covers every 0.2 transition; per-role snapshots
      specified
- [ ] Invalid/out-of-phase intent → rejected with typed error, state unchanged
- [ ] Fresh connection receives complete current state
**Verification:** BE hub unit tests; FE reducer tests applying snapshot.
**Dependencies:** 7, 8. **Size:** M

### Task 10: Session lifecycle + reconnect
**Description:** Facilitator-password-gated session creation (PW server-set,
never client-stored); participant join by `sessionId`; membership persisted;
tab close/reopen restores facilitator control and participant membership.
**Acceptance criteria:**
- [ ] Wrong/absent facilitator PW → creation rejected
- [ ] Reconnect (both roles) restores role + session view without rejoin
- [ ] Membership survives backend restart
**Verification:** BE tests + Playwright reconnect smoke.
**Dependencies:** 7, 8, 9. **Size:** M

### Task 11: Phase state machine
**Description:** 9 phases, forward-only, facilitator-only advance; per-phase
sub-state slots (quiz question index, tiebreak round, presented group); pure
Domain logic, persisted via Task 7.
**Acceptance criteria:**
- [ ] Non-facilitator advance intent rejected
- [ ] Backward transition impossible
- [ ] Sub-state transitions unit-tested per phase
**Verification:** `dotnet test backend` (state machine suite).
**Dependencies:** 7, 9. **Size:** M

### Checkpoint B
- [ ] E2E smoke: create session (PW), join via OIDC, presenter shows session;
      kill+restart backend → facilitator, participant, presenter all resume

---

## Phase C: Workshop Phases 1–4

### Task 12: Phase 1 — Join
**Description:** Presenter shows large QR (join URL with sessionId);
participant lands in lobby after login; facilitator sees live participant
list and advances.
**Acceptance criteria:**
- [ ] QR encodes working join URL
- [ ] Participant list updates live on join
**Verification:** FE component tests + Playwright join flow.
**Dependencies:** 10, 11. **Size:** M

### Task 13: Quiz content + backend logic
**Description:** `config/quiz.json`: 5 questions, 3 answers each (correct /
wrong / funny-wrong), learning texts, de+en. BE: one vote per participant per
question, live tallies, sub-controls (next question, reveal, learning text).
**Acceptance criteria:**
- [ ] Duplicate vote rejected; tally correct
- [ ] Reveal/learning-text only via facilitator intents
**Verification:** BE quiz suite; JSON schema validation test on config.
**Dependencies:** 11. **Size:** M

### Task 14: Quiz frontend
**Description:** Participant answer buttons; presenter live bar charts
animating as votes arrive; facilitator sub-controls. Extend multi-client e2e
through workshop phase 2.
**Acceptance criteria:**
- [ ] Bars update without reload as votes arrive
- [ ] Correct answer highlighted after reveal; learning text togglable
- [ ] Multi-client e2e now covers phases 1–2 and runs in CI
**Verification:** FE component/reducer tests; Playwright: 3 participants vote,
bars reflect tallies.
**Dependencies:** 12, 13. **Size:** M

### Task 15: Phase 3 — Value selection
**Description:** `config/values.json` (~50 values, de+en). Participant
selects exactly 10, no duplicates; server enforces; submission locks in.
**Acceptance criteria:**
- [ ] <10 or >10 or duplicate selection rejected server-side
- [ ] Facilitator sees submission progress count
- [ ] Multi-client e2e extended through phase 3
**Verification:** BE selection suite; FE selection UI tests.
**Dependencies:** 11. **Size:** M

### Task 16: Phase 4 — Selection results
**Description:** Bar chart of top-10 most-selected values; if tie at 10th
place, all tied values shown (>10 bars). Presenter + facilitator views.
**Acceptance criteria:**
- [ ] Tie at 10th place includes all tied values (unit-tested)
- [ ] Chart reads from server-computed tallies only
- [ ] Multi-client e2e extended through phase 4
**Verification:** BE tally/tie tests; Playwright visual presence check.
**Dependencies:** 15. **Size:** S

### Checkpoint C
- [ ] Playwright: facilitator + presenter + 3 participants through phases 1–4

---

## Phase D: Grouping + Group Work

### Task 17: CP-SAT wrapper  *(parallelizable after Checkpoint B)*
**Description:** First write `design/cpsat-model.md` (variables, constraints,
objective as linear formulation, symmetry breaking, hand-worked example
N=8/V=6 with expected optimum). Then implement: BE service (adapter behind
Application port) wrapping OR-Tools CP-SAT. Sizing rule (plan.md): `G = max(1, floor(N/4))`;
participant group sizes `floor(N/G)` (+1 for first `N mod G`); same deal-out
for values. Model assigns participants AND values; objective: maximize
Σ over participants of |own 10 selections ∩ group's values|. 3 s time cap,
best incumbent; symmetry breaking on group labels.
**Acceptance criteria:**
- [ ] Sizing rule unit-tested (incl. N=30→7 groups 5,5,4,4,4,4,4; N<8 edge)
- [ ] Returns valid partition within 3 s for N=30, V=10 (wall-clock test)
- [ ] Objective verified on small hand-checkable instances
**Verification:** `dotnet test backend` (solver suite).
**Dependencies:** 3 (OR-Tools in image), 7. **Size:** M

### Task 18: Phase 5 — Group selection
**Description:** On phase entry, run solver over survivors from Phase 4;
assign animal-name labels; show groups + assigned values on all screens;
persist assignment.
**Acceptance criteria:**
- [ ] Assignment persisted; restart keeps identical groups
- [ ] Each participant sees own group + its values
- [ ] Multi-client e2e extended through phase 5
**Verification:** BE integration test; Playwright group display check.
**Dependencies:** 16, 17. **Size:** M

### Task 19: Group work backend
**Description:** Random scribe per group at phase entry; facilitator can
reassign scribe anytime. Actions: 1–5 per assigned value, scribe-only
create/edit/delete; group submit + un-submit (scribe-only).
**Acceptance criteria:**
- [ ] Non-scribe mutation intents rejected
- [ ] 1–5 bound enforced; submit/un-submit toggles editability
- [ ] Reassignment moves rights instantly (old scribe rejected)
**Verification:** BE group-work suite.
**Dependencies:** 18. **Size:** M

### Task 20: Group work frontend
**Description:** Scribe editor (actions per value, submit/un-submit);
read-only live view for other members; facilitator overview with per-group
submit status + scribe reassignment control.
**Acceptance criteria:**
- [ ] Member view updates live as scribe types/saves
- [ ] Facilitator reassignment swaps editor/read-only roles without reload
- [ ] Multi-client e2e extended through phase 6
**Verification:** FE tests + Playwright two-participant scribe scenario.
**Dependencies:** 19. **Size:** M

### Checkpoint D
- [ ] Playwright: 8 participants → 2 groups, solver <3 s, scribe reassign,
      actions submitted

---

## Phase E: Presentation + Voting + PDF

### Task 21: Phase 7 — Value presentation
**Description:** Facilitator selects which group is presenting; presenter
shows that group's values + actions; participants see passive view.
**Acceptance criteria:**
- [ ] Group switch reflects on presenter without reload
- [ ] Only submitted content shown
- [ ] Multi-client e2e extended through phase 7
**Verification:** FE tests + Playwright switch check.
**Dependencies:** 20. **Size:** S

### Task 22: Final voting backend
**Description:** 5 votes per participant across all presented values;
multi-votes up to 5 on one value; storage anonymous (tallies + has-voted
flag only — no voter↔vote rows). Tie at 5th place → tiebreak round over
tied values only, votes-per-participant = number of tied values, repeat
until exactly 5 survive. Facilitator sub-control starts each tiebreak.
**Acceptance criteria:**
- [ ] >5 votes rejected; vote data contains no participant identifier
      (asserted by test against DB schema/rows)
- [ ] Tiebreak detection + round loop unit-tested (incl. repeated ties)
**Verification:** BE voting suite incl. anonymity assertion.
**Dependencies:** 21. **Size:** M

### Task 23: Final voting frontend
**Description:** Participant vote-allocation UI (distribute 5, multi-vote);
facilitator sub-controls (close voting, start tiebreak); presenter view per
spec (no live individual votes).
**Acceptance criteria:**
- [ ] Cannot submit ≠ allotted votes; tiebreak round shows only tied values
- [ ] Multi-client e2e extended through phase 8 incl. forced tiebreak
**Verification:** FE tests + Playwright vote + forced-tiebreak scenario.
**Dependencies:** 22. **Size:** M

### Task 24: Phase 9 — Final presentation + PDF
**Description:** Winners (5 values + actions) on presenter. Participant
download button renders PDF client-side via `@react-pdf/renderer`: all
anonymous vote tallies, all worked-out actions, winners; de+en.
**Acceptance criteria:**
- [ ] PDF downloads in Playwright; contains winners, tallies, actions
- [ ] No participant names/ids anywhere in PDF
- [ ] Multi-client e2e now covers all 9 phases end-to-end
**Verification:** Playwright download + PDF text extraction assertions.
**Dependencies:** 22, 23. **Size:** M

### Checkpoint E
- [ ] Playwright: phases 7–9 incl. one tiebreak; PDF verified anonymous

---

## Phase F: Hardening + Polish

### Task 25: Restart-recovery + reconnect e2e
**Description:** Kill backend mid-quiz, mid-group-work, mid-voting; restart;
all three roles resume exactly. Tab close/reopen for facilitator and
participant in same phases.
**Acceptance criteria:**
- [ ] All kill/restart scenarios pass; no lost votes/actions/phase state
**Verification:** dedicated Playwright suite.
**Dependencies:** 24. **Size:** M

### Task 26: i18n completeness
**Description:** de+en for every screen and PDF; guard (test or lint) that
fails on missing translation keys.
**Acceptance criteria:**
- [ ] Key-parity check in CI; app fully usable in both locales
**Verification:** guard test + manual locale flip.
**Dependencies:** 24. **Size:** S

### Task 27: Full 9-phase e2e stability
**Description:** The multi-client e2e has grown with every workshop phase
(Tasks 14–24) and already covers all 9 phases. This task hardens it: single
run with facilitator + presenter + several participants, deflaked, repeatable
(SPEC.md success criterion).
**Acceptance criteria:**
- [ ] Green in CI pipeline and no-mistakes gate, repeatably (3 consecutive runs)
**Verification:** run 3×.
**Dependencies:** 25. **Size:** S

### Task 28: README + demo polish
**Description:** README with setup, one-command demo, GIF/screenshots of all
three screens (portfolio substitute for live deploy); seed data polish.
**Acceptance criteria:**
- [ ] Fresh-clone-to-running-demo works following README only
**Verification:** clean checkout dry run.
**Dependencies:** 27. **Size:** S

### Checkpoint F — Done
- [ ] Every SPEC.md success criterion checked off
