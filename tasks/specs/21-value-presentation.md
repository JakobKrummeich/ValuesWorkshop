# Task 21 — Phase 7: Value presentation

Size: S. Branch: `task-21-value-presentation`. Depends on 20 + Checkpoint D
(merged). Lands the Task 11 Q1 deferrals: the `GoToNextValue` walk cursor
and the `ValuePresentationExitGuard` registration.

## Why

Phase 7 is a read-mostly phase: the room looks at the wall while the
facilitator steps value by value through each group's submitted actions.
The backend state shells exist (`PresentationWalk`, `PresentationView`
mappers, the unwired guard) but nothing moves the walk and all three
screens render `EmptyPhase`.

## Behavior

- **The walk runs in per-group blocks** (review 2026-08-26): each group's
  block opens with a **group intro screen** ("up next: Group Otter" — just
  the group, nothing else), then one step per assigned value (the value
  plus its actions). `GoToNextValue` steps intro → first value → … → last
  value → next group's intro → …; the intro between groups looks the same
  as the intro on phase entry.
- **Entry**: on entering phase 7 the walk stands on the first group's
  intro screen (a phase entry action, like scribe appointment on phase 6).
- **Facilitator**: sees the presenting position (group + value, or group
  intro), the presented actions with an inline wording-fix affordance
  (`EditAction`, typo fixes only — add/remove refused per I10), a "Next"
  button (`GoToNextValue`), and Advance disabled until every group's every
  value has been shown (walk complete).
- **GoToNextValue** is refused when nothing is left to show (the walk
  stands on the last value of the last group).
- **Presenter**: fullscreen — on an intro position the group-up-next
  screen; on a value position the presenting group's name, the presented
  value, its actions numbered. No position counter, no paging.
- **Participant**: the shared calm waiting screen (pulsating circle) —
  attention belongs to the wall.
- Only submitted content is shown (phase-6 exit guard already guarantees
  every group is submitted).

## Decisions

- **D1 — walk order is formation order**: groups in their formation
  (animal) order, each group's assigned values in their stored sort order.
  Deterministic, matches the wall's card order.
- **D2 — the walk advances by command only.** No timers. The facilitator
  is the clock, as everywhere else.
- **D3 — exit guard count derives from the session**: the guard is
  registered in `PhaseExitGuards` and satisfied when
  `ShownValueCount == the session's total assigned values` (sum over
  groups — 10 today). No hardcoded constant; the record keeps its
  `PresentedValueCount` parameter, filled per session at guard evaluation
  (adapt `IPhaseExitGuard` evaluation only if unavoidable).
- **D4 — facilitator EditAction reuses the domain edit path** with a
  facilitator authorization branch scoped to phase 7 and to the currently
  presented value's actions; text rules unchanged (trim, 200 elements,
  non-empty on a submitted group stays guaranteed by rejecting empties).
- **D5 — participant screen reuses the shared `WaitingScreen`** from
  phase 4 (it was built to be reusable for 7/9).
- **D6 — the wire carries the position kind implicitly**: a group intro is
  `PresentingGroupName` set with `PresentedValueId` null; a value position
  has both set. No new block type — the existing `PresentationView` /
  `PresenterPresentationView` shapes already allow it (presenter view
  gains the group name).

## Slices

1. Domain: `PresentationWalk.GoToNextValue(formation)` + entry
   initialization + walk-complete rule; `ValuePresentationExitGuard`
   registered with the session-derived count; facilitator wording-edit
   authorization.
2. Application: `GoToNextValueCommand` + facilitator handler entries
   (`GoToNextValue`, presented-action `EditAction`); enabled-intents.
3. Frontend: zod for the presentation views; facilitator screen (position,
   actions with inline edit, next-value, advance); presenter card;
   participant waiting screen wiring.
4. E2e: extend `workshopAtScale.spec.ts` into phase 7 — walk two positions,
   wall follows without reload, facilitator fixes a typo, advance stays
   locked until the last value, then unlocks.

## Out of scope

Phase 8 (final voting, Task 22). Auto-advance. Any participant mirror of
the presentation.
