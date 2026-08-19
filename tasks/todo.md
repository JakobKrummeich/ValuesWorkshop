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

### Task 1: Scaffold monorepo (hexagonal skeletons) ✅

### Task 2: Design tokens + stylelint gate ✅

### Task 3: docker compose ✅

### Task 4: Architecture tests ✅

### Task 5: Complexity + duplication + formatting gates ✅

### Task 6: CI/CD pipeline + branch protection + no-mistakes wiring ✅

### Checkpoint A ✅
- [x] compose up serves all apps; every gate proven by deliberate violation
      (test, lint, arch, complexity, duplication, coverage); red PR blocked,
      green PR merges; PR merged to main

---

## Phase B: Session Core

### Task 7: SQLite persistence layer ✅
**Description:** First write `design/persistence.md` (tables, keys,
write-before-broadcast flow, recovery procedure, schema-level anonymity
argument), then implement: session store (adapter behind Application port),
every state mutation persisted before broadcast; on startup, all sessions
reload to exact prior state.
**Acceptance criteria:**
- [x] `design/persistence.md` written; no voter↔vote linkage possible by
      schema
- [x] Write-before-broadcast enforced in one code path (no ad-hoc saves)
- [x] Round-trip test: mutate → new store instance → identical state
**Verification:** `dotnet test backend` (persistence round-trip suite).
**Dependencies:** 1. **Files:** `backend/Adapters.Persistence/*`. **Size:** M

### Task 7b: EF Core migrations
**Spec:** `tasks/specs/07b-schema-migrations.md`.
**Description:** Replace `EnsureCreated()` with EF Core Migrations applied at
startup, after Checkpoint B hit `table presentation_state has no column named
shown_value_count` on an existing database. Reverses the Task 7 no-migration
decision.
**Acceptance criteria:**
- [x] Pre-migrations database is detected and refused at startup with an actionable message naming the file
- [x] Model change without a migration fails the build (drift guard)
- [x] Tests build their schema through migrations
- [x] `design/persistence.md` documents the migration workflow
**Verification:** `dotnet test backend` + compose smoke against an old database.
**Dependencies:** 7. **Size:** S

### Refactor note: split Adapters by concern ✅
**Done.** `backend/Adapters` split into `Adapters.Persistence` (EF Core +
SQLite) and `Adapters.Web` (SignalR shell). OR-Tools moved to Host.
Architecture tests enforce cross-adapter isolation. On FE side, similarly
keep adapter modules separated by concern (e.g., SignalR adapter vs. API
adapter) rather than one shared bucket.

### Task 8a: RxJS migration + marble tests + component structure refactor ✅
**Description (component refactor):** Refactor AuthGuard and AuthCallbackPage
to the hook-component-css split per `frontend/FE-IMPLEMENTATION-RULES.md`.
Extract `useAuthGuard.ts` and `useAuthCallback.ts` hooks containing all
logic. The `.tsx` files become thin shells that call the hook and render.
Add thorough hook tests; simplify component tests to mock hooks.
**Acceptance criteria:**
- [x] AuthGuard split: `useAuthGuard.ts` + `AuthGuard.tsx` + `AuthGuard.module.css`
- [x] AuthCallbackPage split: `useAuthCallback.ts` + `page.tsx` + `CallbackPage.module.css`
- [x] Hook tests cover all logic branches
- [x] Component tests mock hooks and verify rendering only

**Description (RxJS migration):**
**Description:** Migrate existing FE code from Promise-based to RxJS-first
architecture per `frontend/FE-IMPLEMENTATION-RULES.md`. Wrap `oidc-client-ts`
promise APIs in thin `defer()`/`from()` adapters returning Observables.
Convert AuthGuard and callback page to subscribe to observables. Add marble
tests for all observable flows. Install `rxjs` as dependency.
**Acceptance criteria:**
- [x] `authAdapter.ts` exports observables, not promises
- [x] Promise→Observable wrappers are the only place `from()`/`defer()` appear
- [x] All auth flows tested with `TestScheduler` marble diagrams
- [x] Zero raw `Promise`/`async`/`await` in non-adapter FE code
- [x] All existing tests pass (rewritten as marble tests where applicable)
**Verification:** `cd frontend && pnpm jest --passWithNoTests` all green.
**Dependencies:** 8. **Size:** S

### Task 8: OIDC auth end-to-end ✅
**Description:** BE validates tokens from dev `oidc-provider`; FE login
redirect flow for facilitator + participant; presenter route unauthenticated.
**Acceptance criteria:**
- [x] Unauthenticated API/hub access rejected (except presenter endpoints)
- [x] Playwright: scripted login against dev provider reaches app
- [x] Provider config (authority/audience) is environment-driven (Azure AD prod)
**Verification:** BE authz unit tests + one Playwright login smoke.
**Dependencies:** 1, 3. **Size:** M

### Task 9: SignalR hub + resync protocol ✅
**Description:** First write `design/protocol.md` (intent/event catalog with
payload schemas, per-role snapshots — no anonymity leaks by schema —, error
model, sequence diagrams for join/vote/reconnect/restart/tiebreak; the FE/BE
contract). Then implement: hub (adapter) with session groups; client intent
envelope validated server-side; full-state snapshot on connect/reconnect.
FE: SignalR client adapter constructed session-bound inside the screen-group
dependency context (SPEC “Session binding at the edge”) — sessionId must not
leak into domain, UI props, or port signatures.
Port layout (locked): ports sliced per concern per role (participant ≈
join/quiz/selection/groupWork/voting; facilitator ≈ lifecycle/quiz-control/
formation/walk-control/tiebreak; presenter ≈ read-only stream), all slices
implemented by ONE session-bound adapter per role, exposed via the role's
dependency context; screens depend only on their slice. Exact slice list
derives from the `design/protocol.md` intent catalog. This replaces the
Task-1 placeholder `<Role>Gateway` interfaces (naming decided then).
**Acceptance criteria:**
- [x] `design/protocol.md` covers every 0.2 transition; per-role snapshots
      specified
- [x] Invalid/out-of-phase intent → rejected with typed error, state unchanged
- [x] Fresh connection receives complete current state
**Verification:** BE hub unit tests; FE reducer tests applying snapshot.
**Dependencies:** 7, 8. **Size:** M
**Residue (carried by later tasks, not gaps in 9):** only `AdvancePhase`
exists today, so `WrongPhase` / `NotAuthorized` / `MalformedPayload`
rejection codes and the payload-validation layer (protocol § 6.3) stay
unexercised, `enabledIntents` is unpopulated, view blocks are thinner than
protocol § 5.2–5.4, and the port slices beyond lifecycle + read stream do
not exist yet. Each lands with the phase task that introduces its intents
(11, 13, 15, 19, 22). Playwright is still not wired into CI — tracked in
Task 14.

### Task 9b: Optimistic concurrency for session mutations
**Description:** `SessionCommandHandler` writes the whole aggregate without a
revision check, so two concurrent intents can lost-update each other (a
roster change can be overwritten by a concurrent `AdvancePhase`). Add
revision-checked persistence: load-with-revision, write only when the stored
revision still matches, retry the intent on conflict, and surface a typed
rejection when retries are exhausted. Task 9 landed only a defensive
`TryGetValue` guard in `ParticipantHub` against the resulting
`KeyNotFoundException`; this task removes the underlying race.
**Acceptance criteria:**
- [x] Concurrent join + advance-phase never loses either mutation
- [x] Conflicting write retries, then rejects with a typed error, state
      unchanged
- [x] Revision increases monotonically per accepted mutation
**Verification:** BE concurrency tests driving two intents against one session.
**Dependencies:** 9. **Size:** S

### Task 10: Session lifecycle + reconnect ✅
**Description:** Facilitator-password-gated session creation (PW server-set,
never client-stored); participant join by `sessionId`; membership persisted;
tab close/reopen restores facilitator control and participant membership.
**Acceptance criteria:**
- [x] Wrong/absent facilitator PW → creation rejected
- [x] Reconnect (both roles) restores role + session view without rejoin
- [x] Membership survives backend restart
**Verification:** BE tests + Playwright reconnect smoke, including the browser
loop deferred from Task 9 (participant joins → facilitator advances phase →
presenter and participant re-render → backend restart → clients reconnect and
show identical state), which needs `POST /api/sessions` to seed a session.
**Dependencies:** 7, 8, 9. **Size:** M

### Task 11: Phase state machine ✅
**Spec:** `tasks/specs/11-phase-state-machine.md` (approved via Lavish).
**Description:** 9 phases, forward-only, facilitator-only advance enforced per
intent, exit guards T2a–T2c with injected question/value counts, named intent
records replacing the anonymous lambda, `phases.ts` generated from the C#
`Phase` enum with a build-time drift check. Sub-state transition mechanics are
deferred to their phase tasks (13, 21, 22) per review decision Q1.
**Acceptance criteria:**
- [x] Non-facilitator advance intent rejected with `NotAuthorized`, state
      unchanged
- [x] Backward transition impossible; past-phase-9 advance rejected
- [x] Each exit guard red-then-green tested
- [x] Build fails when checked-in `phases.ts` diverges from the C# enum
- [x] Phase + guard state survive a store round-trip
**Note:** phase 8→9 cannot be walked until Task 22 lands the winning values —
the I15 guard blocks by design and no other producer of winners exists. The
quiz and value-presentation guards stay unregistered until Tasks 13 and 21
construct them with the real content counts.
**Verification:** `dotnet test backend` (state machine suite) + codegen check.
**Dependencies:** 7, 9. **Size:** M

### Checkpoint B ✅
- [x] E2E smoke: create session (PW), join via OIDC, presenter shows session;
      kill+restart backend → facilitator, participant, presenter all resume
      (16/16 Playwright, twice consecutively, on a clean compose stack)

**Learnings folded into Phase C:**
1. The checkpoint run exposed a real defect — `EnsureCreated()` never evolves a
   schema, so the Task 11 column broke every existing database. Fixed by Task
   7b (EF Core migrations + drift guard). Any future schema change now ships
   its migration in the same PR.
2. Playwright is still not in CI, and it is now the only thing that catches
   this class of defect — moved from Task 14 up to Task 12.
3. de+en is a SPEC promise the reviewer already asked about; screens now ship
   both languages from the first screen rather than deferring to Task 26.
4. A live session walks phases 1→8 today and stops at 8 until Task 22 supplies
   the winners; quiz and presentation guards go live with Tasks 13 and 21.

---

## Phase C: Workshop Phases 1–4

### Task 12: Phase 1 — Join ✅
**Description:** Presenter shows large QR (join URL with sessionId);
participant lands in lobby after login; facilitator sees live participant
list and advances.
**Acceptance criteria:**
- [x] QR encodes working join URL
- [x] Participant list updates live on join
- [x] Screens ship de+en from the start (no English-only placeholder text)
- [x] **Moved up from Task 14:** Playwright wired into CI — compose (or
      `webServer`) startup in `playwright.config.ts` plus a job in
      `.github/workflows/ci.yml`, covering the Task 10 reconnect/restart smoke
      that is still local-only
**Verification:** FE component tests + Playwright join flow.
**Dependencies:** 10, 11. **Size:** M

### Task 13: Quiz content + backend logic ✅
**Spec:** `tasks/specs/13-quiz-backend.md` (approved via Lavish).
**Description:** `config/quiz.json`: 5 questions, 3 answers each (correct /
wrong / funny-wrong), learning texts, de+en. BE: one vote per participant per
question, live tallies, sub-controls (next question, reveal, learning text).
**Acceptance criteria:**
- [x] Duplicate vote rejected; tally correct
- [x] Reveal/learning-text only via facilitator intents
- [x] **From Task 11 (Q1 deferral):** quiz sub-state mechanics land here —
      `PoseNextQuestion` / `RevealAnswer` / `ShowLearningText`, strictly forward
      `Answering → Revealed → LearningTextShown` per question, illegal order
      rejected, transitions round-trip through the store (review decision:
      repeat reveal/show is an idempotent no-op — no save, no revision bump)
- [x] **From Task 11:** turn on the phase exit guard by registering a
      `QuizExitGuard` with the real question count in the host `PhaseExitGuards`
- [x] **From Task 11:** the quiz cursor stays 0-based end to end —
      `current_question_index`, `QuizProgress.CurrentQuestionIndex`, the
      `questionIndex` wire field, no number/index conversion anywhere
**Learnings for Task 14:** per-role quiz view blocks already carry catalog
content (question/answer/learning texts, both locales) on the wire — FE never
reads `config/`; participant/presenter get `correctAnswerIndex`/`learningText`
only once revealed/shown; facilitator always sees both.
**Verification:** BE quiz suite; JSON schema validation test on config.
**Dependencies:** 11. **Size:** M

### Task 14: Quiz frontend ✅
**Spec:** `tasks/specs/14-quiz-frontend.md` (approved via Lavish).
**Description:** Participant answer buttons; presenter live bar charts
animating as votes arrive; facilitator sub-controls. Extend multi-client e2e
through workshop phase 2.
**Acceptance criteria:**
- [x] Bars update without reload as votes arrive
- [x] Correct answer highlighted after reveal; learning text togglable
- [x] Multi-client e2e now covers phases 1–2 and runs in CI (the CI wiring
      itself moved to Task 12)
- [x] **Protocol §6.4 gap closed here:** facilitator envelope now ships
      `enabledIntents` (accepted-and-state-changing only, idempotent no-ops
      excluded), computed via `RegisteredExitGuards.For` — the same guard
      registration Host and tests share; all quiz views carry `questionCount`
**Learnings for Task 15:** participant intent wiring now has a full template
(`ParticipantQuizPort` → adapter → `workshopSessions` → boundary →
dependencies → `useIntentSender`); every new facilitator intent must be added
to BE `FacilitatorIntent` + `FacilitatorEnabledIntents` and the FE enum in the
same PR (zod hard-fails on unknown intent names); e2e reruns need the raised
dev-compose session-creation rate limit; presenter wall never scrolls — check
tall states against 1080p.
**Verification:** FE component/reducer tests; Playwright: 3 participants vote,
bars reflect tallies.
**Dependencies:** 12, 13. **Size:** M

### Task 15: Phase 3 — Value selection ✅
**Spec:** `tasks/specs/15-value-selection.md` (approved via Lavish, 3 rounds).
**Description:** `config/values.json` (50 values, de+en, research-grounded
catalog: Schwartz/Rokeach/Ryff/Aristotle). Participant selects exactly 10,
no duplicates; server enforces; submission locks in behind a confirm dialog.
**Acceptance criteria:**
- [x] <10 or >10 or duplicate or unknown-id selection rejected server-side
      (`MalformedPayload`); resubmission rejected (`InvariantViolated`, I6)
- [x] Facilitator sees submission progress count; presenter shows prompt +
      progress, never tallies (secrecy-tested for all roles in phase 3)
- [x] Multi-client e2e extended through phase 3 (shared quiz fast-forward
      helper in `e2e/support/quizFastForward.ts`)
**Learnings for Task 16:** `SelectionRound` already derives
`SelectionTallies`, `HasSubmitted`, `SubmittedCount` — Task 16 only flips
tallies/top values onto the wire for phase 4 (`selectionTallies?`/
`topValueIds?` are already optional in protocol §5.2–5.4, zod, and
`JsonIgnore WhenWritingNull` views) and must update
`SelectionTalliesSecrecyTests` to assert phase-4 presence alongside phase-3
absence; selection views carry the full values catalog on the wire, so the
results chart gets its labels for free; `selection_submissions` is now
write-only (`value_selections` is the source of truth, see
`design/persistence.md`) — fold the migration dropping it into Task 16's
`top_values` persistence work; while touching Domain exception messages,
remove the pre-existing internal `(I1)`/`(I5)` tags (review preference:
no invariant tags in user-facing messages).
**Verification:** BE selection suite; FE selection UI tests.
**Dependencies:** 11. **Size:** M

### Task 16: Phase 4 — Selection results ✅
**Spec:** `tasks/specs/16-selection-results.md` (approved via Lavish).
**Description:** On entry into phase 4 the server fixes the top values from
the selection tally (count desc, config-order tiebreak; tie at 10th place
widens the set past 10; empty on zero submissions) and puts
`selectionTallies`/`topValueIds` on the wire for all three roles. Facilitator
and presenter render the same top-values bar chart (Lavish decision, replacing
the earlier two-column list mock): the 20 most-selected values in two columns
(ranks 1–10 left, 11–20 right), label + count + bar ∝ selections with the
most-selected at full width, top set color-highlighted, "and x more" hint
below the cutoff, empty-state note on zero submissions. The participant shows
a waiting screen instead — icon + slow pulsating circle, no chart — so
attention belongs on the presenter wall (Lightspeed decision). Fold-ins: migration
dropping the write-only `selection_submissions` table; `(I1)`/`(I5)` tags
stripped from Domain exception messages.
**Acceptance criteria:**
- [x] Tie at 10th place includes all tied values (unit-tested)
- [x] Chart reads from server-computed tallies only
- [x] Multi-client e2e extended through phase 4
**Learnings for Task 17/18:** the fixed top values persist on the session
(`top_values`, restored by `DomainEntityMapper`) — the solver input for
phase 5 is already durable; ~~`FacilitatorIntentHandler` now threads the
values-catalog order into `session.AdvancePhase(caller, exitGuards,
CatalogValueIds())`~~ (revised by spec 16a: catalog threading removed;
`DetermineTopValues` is parameterless, `AdvancePhase` takes no catalog),
and `DetermineTopValues` runs as a phase-entry hook
inside `AdvancePhase` — `FormGroups` on phase-5 entry can follow the same
pattern; the phase-5 `GroupFormation` states still build their selection
block with the plain `SelectionViews.Progress` (facilitator/presenter) or
none at all (participant), so tallies/top values drop off the wire again
after phase 4 — Task 18 must switch to `ProgressWithResults` (or a new
view) if the group screens need them.
**Verification:** BE tally/tie tests; Playwright visual presence check.
**Dependencies:** 15. **Size:** S

### Checkpoint C ✅
- [x] Playwright: facilitator + presenter + 3 participants through phases 1–4

---

## Phase D: Grouping + Group Work

### Task 17: CP-SAT wrapper ✅
**Spec:** `tasks/specs/17-cpsat-wrapper.md` (approved via Lavish).
**Description:** First write `design/cpsat-model.md` (variables, constraints,
objective as linear formulation, hand-worked example
N=8/V=6 with expected optimum). Then implement: BE service (adapter behind
Application port) wrapping OR-Tools CP-SAT. Sizing rule (plan.md): `G = max(1, floor(N/4))`;
participant group sizes `floor(N/G)` (+1 for first `N mod G`); same deal-out
for values. Model assigns participants AND values; objective: maximize
Σ over participants of |own 10 selections ∩ group's values|. 3 s time cap,
best incumbent; no manual symmetry breaking (CP-SAT auto).
**Acceptance criteria:**
- [x] Sizing rule unit-tested (incl. N=30→7 groups 5,5,4,4,4,4,4; N<8 edge)
- [x] Returns valid partition within 3 s for N=30, V=10 (wall-clock test)
- [x] Objective verified on small hand-checkable instances (proven-unique
      optimum 22 for the N=8/V=6 doc example)
**Verification:** `dotnet test backend` (solver suite).
**Dependencies:** 3 (OR-Tools in image), 7. **Size:** M

### Task 18: Phase 5 — Group formation ✅
**Spec:** `tasks/specs/18-group-formation.md` (approved via Lavish).
**Description:** Entering phase 5 forms the groups as a Domain procedure:
`Session.AdvancePhase(caller, exitGuards, groupSolver, animalNames)` builds
the solver request from its own state (full roster, per-participant submitted
selections, fixed top values), calls the CP-SAT solver through the Domain
ports `IGroupSolver`/`IAnimalNames` (Domain ROOT namespace, `IRandomness`
precedent — `Domain.Ports` would cycle with `Domain` under the ArchUnit
slice rule), and creates `Group` aggregates named by `config/animals.json`
order (host loader `AnimalsCatalogFile`, fail-fast validation). I8: formation
is idempotent, restore never re-forms, restart keeps identical groups; late
joiners from phase 5 on land in the smallest group, values untouched. Views:
participant own-group card (animal name, members top-left, value chips
bottom-right, no labels/icon), facilitator all-groups list, presenter 3×2
cards cycling every 7 s (static single page when all fit); the animal name
rides the wire as id + `{de,en}` text. Scribe/work-status fields were removed
from the shipped view records (not null-carried) — protocol §5 documents them
as absent until T19/T20.
**Acceptance criteria:**
- [x] Assignment persisted; restart keeps identical groups
- [x] Each participant sees own group + its values
- [x] Multi-client e2e extended through phase 5
**Learnings for Task 19:** the `Group` aggregate already carries
`Scribe`/`IsSubmitted` restore-only fields (`Group.Restore`) awaiting
behavior; `AppointScribes` fires on P5→6 entry — the `AdvancePhase`
double-dispatch port pattern (`groupSolver`/`animalNames` passed at the point
of use, `IRandomness` already in the Domain root) is the template; the group
child tables (`group_members`, `group_assigned_values`, `group_actions`)
carry `sort_order` columns, so ordering is durable; the wire group blocks
(`ownGroup`, facilitator/presenter `groups`) are shared across phases 5/6/7
— Task 19 re-adds scribe/work-status there as optionals (protocol §5 already
documents the shapes); the full-session load now runs with `AsSplitQuery`
(`SqliteSessionRepository`).
**Verification:** BE formation/round-trip/late-join suites; Playwright
phases 1–5.
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
- [ ] **From Task 11 (Q1 deferral):** presentation walk cursor mechanics land
      here — `GoToNextValue` over group → value, persisted
- [ ] **From Task 11:** turn on the phase exit guard by registering a
      `ValuePresentationExitGuard` with the real presented-value count in the
      host `PhaseExitGuards`
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
- [ ] **From Task 11 (Q1 deferral):** voting round mechanics land here —
      `CloseVoting`, `StartTiebreakRound` bumping `RoundNumber`, tiebreak while
      a round is open rejected, persisted
- [ ] **From Task 11:** phase 8→9 cannot be walked until this task lands the
      winning values — the I15 exit guard blocks every advance out of final
      voting until `WinnersDetermined` produces exactly five winners
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
