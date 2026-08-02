# Task 11 — Phase state machine

## Goal

Make `design/state-machine.md` executable in the Domain: forward-only phase
walk with exit guards, facilitator-only advance enforced per intent, and the
sub-state slots (quiz cursor, presentation cursor, voting round) turned from
`Restore`-only shells into guarded transitions.

## Today

`PhaseProgress.Advance` enforces I1 (forward-only) and nothing else.
`QuizProgress`, `PresentationWalk`, `VotingRounds` hold their fields but have
no mutators. `FacilitatorHub.AdvancePhase` relies on the connect-time
`RequireFacilitator` check; the intent itself is unauthorized. Exit guards
T2a–T2c, System entry commands (T10/T11/T12/T20/T23) and every sub-state
transition are unimplemented.

## In scope

1. **Advance guards.** `Session.AdvancePhase` rejects when the current phase's
   exit guard fails: 2→3 all questions walked, 6→7 every group `Submitted`
   (I12), 7→8 all values shown, 8→9 exactly five winners stand (I15). Typed
   rejection `WrongPhase` (distinct from `InvariantViolated`).
2. **Facilitator-only advance per intent.** The advance path checks the actor,
   not just the connection; a non-facilitator caller gets `NotAuthorized`.
3. **Named intents.** Replace the anonymous `Func<Session,bool>` lambda in
   `FacilitatorHub` with named command records routed through `IntentPipeline`,
   so the rejection taxonomy has real producers.
4. **Phase-enum codegen.** `frontend/src/domain/phases.ts` is generated from
   the C# `Phase` enum at build time; the build fails when the checked-in file
   differs from the generated one, so drift cannot reach a green build.
5. **Persistence.** Phase and guard-relevant state round-trip through SQLite
   under the existing revision check.

## Out of scope (decision Q1 = B)

**Sub-state transition mechanics** move to the phase task that needs them:
quiz cursor (`PoseNextQuestion` / `RevealAnswer` / `ShowLearningText`) → Task
13; presentation walk cursor (`GoToNextValue`) → Task 21; voting round
open/close/tiebreak bump → Task 22. Task 11 leaves the slots as they are and
only reads them in its guards. Each of those tasks gets an explicit acceptance
criterion in `tasks/todo.md` so this does not get forgotten.

Also out: quiz/values content and tallies (13, 15), group work rights (19),
solver-driven formation (17/18), vote counting and tiebreak *detection* (22). System entry commands that
need computed data (T10 `DetermineTopValues`, T11 `FormGroups`,
T12 `AppointScribes`, T20, T23) stay with their owning tasks; Task 11 only
defines the hook where they fire.

## Acceptance criteria

- [ ] Non-facilitator advance intent rejected with `NotAuthorized`, state
      unchanged
- [ ] Backward transition impossible; past-phase-9 advance rejected
- [ ] Each exit guard has a red-then-green test (blocked, then passing once the
      guard condition holds)
- [ ] Phase-enum codegen: build fails when checked-in `phases.ts` diverges from
      the C# enum
- [ ] Phase + guard state survive a store round-trip

## Slices

1. Named intent records + per-intent facilitator authorization (`NotAuthorized`)
2. Exit guards on `AdvancePhase` (`WrongPhase`), counts injected + tests
3. Phase-enum codegen + build-time drift check
4. Persistence round-trip tests + follow-up criteria written into Tasks 13/21/22

## Review decisions (Lavish, approved)

- **Q1 → B** Sub-state mechanics stay with their phase tasks; Task 11 must
  record the follow-ups so they are not lost.
- **Q2 → A** Inject the question/value count into the Domain now (placeholder
  count until content exists) so the 2→3 and 7→8 guards land with this task.
- **Q3 → B** Generate `phases.ts` from the C# enum at build time — fail fast
  on drift.
