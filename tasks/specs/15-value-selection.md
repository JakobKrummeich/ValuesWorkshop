# Spec 15 — Phase 3: Value selection

## Objective

Workshop phase 3 becomes fully playable end to end: each participant picks
exactly 10 values from a ~50-value bilingual catalog and submits once
(I6, T9 `SubmitValueSelection`); the facilitator watches the submission
progress count and advances on judgment (no hard exit guard,
state-machine.md §2.3); the presenter wall shows prompt + progress — never
tallies (screens.md:29, bias avoidance). Multi-client e2e extends through
phase 3 into the phase-4 placeholder. Top-values computation
(`DetermineTopValues`, I7) is Task 16.

## Scope

### 1. Content + catalog (quiz pattern verbatim)

- `config/values.json`: expand 5 → 50 values about work culture, unique
  ids, de+en. Content drafted by agent, user reviews in this spec review.
- `IValuesCatalog` port (Application, like `IQuizCatalog`) +
  `ValuesCatalogFile` loader in Host (fail fast: missing file, invalid
  JSON, empty, duplicate ids, missing locale) + `TestValuesCatalog` in
  TestSupport.
- Schema test: 50 entries, unique ids, both locales non-empty everywhere.

### 2. Domain — submission, I6, tallies

- `SelectionRound` (today an empty restore-shell) gains
  `Submit(participant, valueIds, validValueIds)` called through `Session`:
  - guards: phase ValueSelection (`WrongPhaseException`); exactly 10
    distinct ids, all in catalog (`MalformedPayloadException` — payload
    shape, same split as T5's out-of-range index); not yet submitted
    (`InvariantViolationException`, I6).
  - stores per-participant selections; tallies derived (count per value),
    never stored.
- Persistence: map to existing `value_selections` +
  `selection_submissions` entities; round-trip test mutate → new store →
  identical state; migration only if columns change. (`top_values` stays
  untouched — Task 16.)

### 3. Application + web

- `SubmitValueSelectionCommand` (participant, `{valueIds}` wire payload as
  string array) through the existing `ParticipantIntentHandler` pipeline;
  hub method `ParticipantHub.SubmitValueSelection(IReadOnlyList<string>)`.
- No new facilitator intent: phase 3 has no sub-controls; `enabledIntents`
  lists `AdvancePhase` throughout (no guard registered — deliberate,
  facilitator judgment per state-machine.md §2.3).

### 4. Per-role selection view blocks (protocol §5.2–5.4)

Replace the placeholder selection views with protocol shapes, plus the
same content-on-the-wire rule as quiz (FE never reads `config/`):

- all roles: `values: [{valueId, text: {de,en}}]` (full catalog, config
  order) — **protocol deviation, documented in the same PR** (§5.2–5.4
  blocks gain the catalog array, exactly like quiz blocks carry their
  content since Task 13)
- participant: `ownSelectedValueIds`, `isSubmitted` (protocol name — FE
  placeholder `isOwnSubmitted` renamed), `selectionTallies?`,
  `topValueIds?` — both absent in phase 3 (tallies/top land in Task 16)
- facilitator + presenter: `submittedCount`, `selectionTallies`,
  `topValueIds?` (absent until phase 4)
- FE zod reconciled to these shapes (placeholders are wrong today:
  missing `ownSelectedValueIds`/`selectionTallies`/`values`).

### 5. Participant selection screen

- New `ParticipantSelectionPort { submitSelection(valueIds):
  Single<IntentResult> }` wired through the Task 14 template (adapter →
  `workshopSessions` → boundary → dependencies → `useIntentSender`;
  `ParticipantIntent` enum gains `SubmitValueSelection`).
- Screen (screens.md:226 grid): "Selected: n/10" counter, scrollable
  toggle-chip grid of all 50 values; below 10 free toggling, at 10 only
  deselection possible (unselected chips disabled); submit button enabled
  at exactly 10/10, then a confirmation dialog before the irrevocable
  submit (Lavish decision), in-flight disable, rejection via
  `intentRejectionMessage`; after `isSubmitted` the whole grid + button
  lock with a submitted notice. Local pre-submit state is client-side
  (selection travels only on submit — T9 is the only intent).

### 6. Facilitator + presenter phase-3 screens

- Facilitator: submission progress ("n von m haben abgegeben", roster
  count as denominator) — Advance stays enabled (no guard).
- Presenter: prompt ("Wählt eure 10 Werte") + same progress count. No
  tallies, no value list rendering needed beyond the prompt.

### 7. e2e — phases 1–3 in CI

- Extend coverage (new `e2e/selectionPhase.spec.ts`, reusing join + quiz
  fast-forward helpers): advance through quiz to phase 3; 3 participants
  each pick 10 (assert counter, at-10 lock of unselected chips) and
  submit; facilitator + presenter progress reaches 3; submitted
  participant sees locked grid; advance → phase 4 placeholder renders
  (empty) without error. Quiz fast-forward extracted into a support
  helper so both specs share it.

## Out of scope

`DetermineTopValues`/I7, `top_values` persistence, tallies/top-values
rendering, phase-4 screens (Task 16). Selection editing after submit.
Search/filter in the grid (50 chips scroll fine).

## Success criteria

- [ ] <10, >10, duplicate, or unknown value id rejected server-side
      (`MalformedPayload`), state unchanged
- [ ] Resubmission rejected (`InvariantViolated`), state unchanged
- [ ] Submission survives store round-trip and backend restart
- [ ] Facilitator sees live submission progress; participant grid locks
      after submit
- [ ] Participant/presenter/facilitator phase-3 states carry no tallies
      and no top values (asserted)
- [ ] values.json schema test green; startup fails on broken content
- [ ] Multi-client e2e covers phases 1–3, green in CI

## Verification

`./scripts/ci-lint.sh` · `./scripts/ci-test.sh` (jest + dotnet + e2e)

## Slices (implementation order)

1. Content + catalog: values.json (50), schema test, `IValuesCatalog` +
   Host loader + `TestValuesCatalog`.
2. Domain `Submit` + I6 + persistence round-trip.
3. Application command, hub method, per-role view blocks + protocol.md
   update + FE zod reconciliation.
4. Participant selection screen + port wiring.
5. Facilitator + presenter progress screens.
6. e2e `selectionPhase.spec.ts` + shared quiz fast-forward helper.

## Decisions (Lavish review)

1. Values content: v3 catalog grounded in values research (Schwartz basic
   human values / Rokeach terminal+instrumental / Ryff PWB / Aristotle
   golden mean per Manson values guide): 50 single-word, personally
   ownable values covering all motivational domains (self-direction,
   openness to change, achievement & mastery, well-being, security &
   order, benevolence, belonging & collective, universalism &
   contribution); practices/benefits/metrics removed (Feedbackkultur,
   Work-Life-Balance, Kundenorientierung, Effizienz…); round-2 rework:
   +Transparenz, overlaps deduped (−Meisterschaft, −Anerkennung,
   −Gerechtigkeit), −Leidenschaft, well-being outcomes are not values
   (−Sinn, −Wachstum per Ryff), +Weisheit, +Großzügigkeit, +Geduld,
   +Demut, +Gelassenheit. — v3 approved.
2. Approved: payload-shape violations (count ≠ 10, duplicates, unknown
   id) → `MalformedPayload`; only resubmission → `InvariantViolated` (I6).
3. Approved: selection views carry the full values catalog on the wire;
   protocol §5.2–5.4 updated in the same PR.
4. Approved: at 10 selected, unselected chips disable; deselect to swap.
5. Decided: confirmation dialog before the irrevocable submit (user chose
   dialog over no-dialog proposal).
