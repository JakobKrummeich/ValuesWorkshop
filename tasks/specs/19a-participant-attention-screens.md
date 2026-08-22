# Task 19a — Participant attention screens

Size: M. Branch: `task-19a-participant-attention-screens`. Inserted before
Task 20 per review decision (lightspeed/lavish session, 2026-08-22).

## Why

Review decision: the participant device must never compete with the beamer or
a presenting person. Whenever the participant has no pending input and the
room's focus is up front, the device shows either the shared calm waiting
screen (pulsating circle, zero interactivity, no caption) or a minimal
confirmation of the participant's own submission — never a mirror of presenter
content.

## Decided screen matrix (participant)

| Phase | Sub-state | Screen |
|---|---|---|
| 1 Join | — | join confirmation (unchanged) |
| 2 Quiz | not yet answered | answer buttons (unchanged) |
| 2 Quiz | answered / revealed / learning text | **"your answer: X" confirmation — no correct-answer display, no learning text on device; resets on next question** |
| 3 Selection | not yet submitted | value grid (unchanged) |
| 3 Selection | after submit | **"submission successful" confirmation (replaces grid + notice)** |
| 4 Selection results | — | calm waiting screen (exists; extract to shared component) |
| 5 Group formation | first 3 s after entry | **progress bar (fixed 3 s, regardless of solve time) on presenter AND participant — Task 19b** |
| 5 Group formation | after 3 s | presenter: cycling group cards (unchanged); participant: own group card (unchanged); facilitator advances as usual |
| 6 Group work | all | group screens (task 20, unchanged here) |
| 7 Value presentation | — | calm waiting screen (spec change: passive mirror deleted) |
| 8 Final voting | open, not voted | voting UI |
| 8 Final voting | own vote submitted / closed | **"votes submitted successfully" confirmation** |
| 8 Final voting | tiebreak reopens | voting UI |
| 9 Final presentation | revealing | calm waiting screen (replaces bespoke notice) |
| 9 Final presentation | concluded | PDF download button |

## Scope of THIS task

1. **Docs**: SPEC.md gains the attention rule (one short paragraph);
   `design/screens.md` participant rows updated to the matrix above
   (phases 2, 3, 5, 7, 8, 9); `design/state-machine.md` phase-5 note if
   auto-advance is deferred (see D1).
2. **Shared component**: extract the pulsating waiting screen out of
   `ParticipantSelectionResultsScreen` into a shared `WaitingScreen`
   component (`frontend/src/app/WaitingScreen.tsx` + module.css); phase 4
   uses it.
3. **Quiz retrofit** (`ParticipantQuizScreen`): after `ownAnswerIndex` is
   set, render an own-answer confirmation view (chosen answer text only)
   instead of the answer grid; no `correctAnswerIndex`/`learningText`
   rendering on the participant device. Next question resets to buttons.
   Backend: participant quiz view stops carrying `correctAnswerIndex` and
   `learningText` (presenter/facilitator views keep them) — data a screen
   must not show is data not sent (per "phase's data exists exactly where
   needed").
4. **Selection retrofit** (`ParticipantSelectionScreen`): once
   `isSubmitted`, render a "submission successful" confirmation view
   instead of grid + notice.
5. **E2e**: existing phase 2/3 participant flows updated to the new
   screens.

Phases 7–9 screens are unbuilt: doc-only here, implemented in their own
later tasks per the matrix.

## D1 — phase 5 (RESOLVED, review 2026-08-22)

> On entering group formation, a progress bar runs for a fixed 3 seconds —
> regardless of actual solve time — on the presenter AND the participant
> screen, to create a sense that something is happening. After it, the
> presenter shows the cycling paginated group cards and the participant shows
> their own group, both as already built. The transition to group work stays
> facilitator-triggered — no auto-advance. This is **Task 19b**, its own task
> after 19a and before Task 20.

## Out of scope

Phase 6 screens (task 20), phases 7–9 implementation, any facilitator or
presenter screen changes except none, backend intents.

## Slices (planning)

1. Shared `WaitingScreen` component + phase 4 uses it (FE, tests).
2. Quiz: BE participant view drops `correctAnswerIndex`/`learningText`;
   FE confirmation view; tests both sides.
3. Selection: FE confirmation view; tests.
4. Docs: SPEC.md rule + `design/screens.md` matrix (+ state-machine note
   per D1); e2e updates.
