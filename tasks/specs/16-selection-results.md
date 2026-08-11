# Spec 16 — Phase 4: Selection results

## Objective

Phase 4 becomes real: on entry the server fixes the top values from the
selection tally (T10 `DetermineTopValues`, system transition, no wire
representation — visible only as changed state), widened on a tenth-place
tie (I7: "the ten most-selected, widened to include all values tied at
tenth place"). All three roles see the results view; tallies and top
values appear on the wire for the first time. Multi-client e2e extends
through phase 4, which completes Checkpoint C (phases 1–4).

## Scope

### 1. Domain — DetermineTopValues (I7)

- `SelectionRound.DetermineTopValues()` fills the existing `topValues`
  list from `SelectionTallies`: order by count desc, then catalog/config
  order for determinism; take 10; widen to include every value tied with
  the 10th. Zero submissions → empty top values (no guard on 3→4;
  facilitator may advance early — state renders an empty result).
- Called from `Session.AdvancePhase` on entry into `SelectionResults`
  (same pattern as `Quiz.PoseFirstQuestion()` on quiz entry).
- Idempotent-repeat = no-op: already-determined top values are never
  recomputed (restore path already carries them via `top_values`).
- Persistence needs no schema change: `DomainEntityMapper` already
  writes/restores `TopValues`. Round-trip test: submit → advance →
  new store → identical top values.
- Drive-by (locked in Task 15 learnings): remove the internal
  `(I1)`/`(I5)` tags from pre-existing Domain exception messages.

### 2. Migration — retire `selection_submissions`

- `value_selections` is the source of truth (persistence.md:165–171);
  the table is write-only today. Drop it: EF migration, delete
  `SelectionSubmissionEntity` + its configuration + the mapper write;
  update persistence.md in the same PR.

### 3. Application + protocol — tallies/top values on the wire

- In `SelectionResults`, per-role selection views populate the already
  existing optional fields (protocol §5.2–5.4, zod already reconciled):
  - participant/facilitator/presenter: `selectionTallies` (valueId →
    count, submitted values only), `topValueIds` (deterministic order:
    count desc, then config order).
  - Phase 3 stays exactly as shipped (both fields absent).
- `SelectionTalliesSecrecyTests` extended: phase-4 presence asserted
  alongside the existing phase-3 absence, all three roles.
- protocol.md touch-up: "absent until phase 4, computed in Task 16" →
  present from phase 4 onward.

### 4. FE — results screens (all three roles)

- Presenter shows "Eure Top-Werte" ("Your top values") as a **bar
  chart** (Lavish decision, overrides the screens.md list mock —
  screens.md updated in the same PR): the 20 most-selected values in
  two columns (ranks 1–10 left, 11–20 right — left column top→bottom,
  then right), each row label + count + horizontal bar, bar width
  proportional to count with the most-selected value filled to the
  max; top values color-highlighted (tie at 10th → 11+ highlighted; if
  the widened top set exceeds 20, the chart grows to show all of it).
  Fewer than 20 distinct selected values → shorter chart. Below the
  cutoff a hint "und x weitere" / "and x more", x = number of values
  with ≥1 selection not shown (omitted when x = 0). Zero submissions →
  heading + empty-state note.
- Participant and facilitator phase 4 mirror the presenter view
  (screens.md:30); facilitator additionally keeps Advance (no 4→5
  guard). Per-role components in `phases/selectionResults/`, replacing
  the `EmptyPhase` mapping in each role's `phaseView.ts`; labels come
  from the `values` catalog already on the wire; display order derived
  client-side from `selectionTallies` (count desc, then catalog order —
  same rule as BE), highlight from `topValueIds` membership.

### 5. e2e — phase 4 + Checkpoint C

- Extend `e2e/selectionPhase.spec.ts`: participants submit **fixed,
  partially overlapping selections** so counts and the top set are
  deterministic; advance → all three roles show the results chart
  (assert a known label + count, highlighted top set present, "and x
  more" hint, facilitator Advance still enabled). English locale as
  established.
- This closes Checkpoint C (facilitator + presenter + 3 participants
  through phases 1–4) — tick both in `tasks/todo.md`.

## Out of scope

Phase-5 content (solver, groups — Tasks 17/18). Any change to phase-3
behavior. Chart libraries (bars are plain CSS-sized divs). Editing
selections after results exist.

## Success criteria

- [ ] Tie at 10th place widens the top set (>10), unit-tested; ordering
      deterministic (count desc, then config order)
- [ ] Top values fixed once on phase entry, survive restart, never
      recomputed (idempotent), empty on zero submissions
- [ ] `selectionTallies`/`topValueIds` present for all roles in phase 4,
      still absent in phase 3 (secrecy tests extended)
- [ ] `selection_submissions` dropped by migration; persistence.md
      updated; round-trip stays green
- [ ] All three FE screens render the two-column highlighted bar chart
      (widths ∝ count, max full) + "and x more" hint from wire data only
- [ ] e2e covers phases 1–4 green in CI; Checkpoint C ticked

## Verification

`./scripts/ci-lint.sh` · `./scripts/ci-test.sh` (jest + dotnet + e2e)

## Slices (implementation order)

1. Domain `DetermineTopValues` + I7 + phase-entry hook + round-trip +
   `(I1)`/`(I5)` tag cleanup.
2. Migration dropping `selection_submissions` + persistence.md.
3. Application phase-4 view population + secrecy-test extension +
   protocol.md touch-up.
4. FE results screens ×3 + phaseView wiring + component tests.
5. e2e phase-4 extension + Checkpoint C + todo.md ticks.

## Decisions (Lavish review)

1. **Bar chart** (user choice, over the screens.md list mock): bars
   filled proportionally to count, most-selected = full width;
   screens.md phase-4 mock updated in the same PR.
2. **Counts visible to everyone in phase 4.** Secrecy only applies to
   phase 3.
3. **Display cutoff:** 20 rows (two columns of ten) unless the widened
   top set is larger, then show the full top set. Hidden values get a
   hint: "and x more", x = values with ≥1 selection below the cutoff.
4. **Zero-submission advance** renders heading + empty-state note
   everywhere (no crash, no fabricated values).
5. **Fold-ins approved:** drop `selection_submissions`, strip
   `(I1)`/`(I5)` tags.
