# Spec 16a — Top-values determination without catalog threading

Follow-up to Task 16 (gate review findings F1/F2, user-approved design).
I7 defines a set: membership needs only tallies (cutoff = tenth-largest
count, include all values at or above it) — no catalog order.

- `SelectionRound.DetermineTopValues()` becomes parameterless.
- `Session.AdvancePhase(caller, exitGuards)` — catalog parameter removed.
- `FacilitatorIntentHandler` drops `IValuesCatalog` + `CatalogValueIds()`.
- Wire/FE ordering untouched: Application mappers own wire order
  (count desc, then catalog order); FE owns display order.
- Tests: domain top-values tests assert membership (order-free);
  callers/fixtures lose the catalog argument. Behavior otherwise
  unchanged — all existing suites stay green.

## Success criteria

- [ ] No `IValuesCatalog` reference in `FacilitatorIntentHandler`
- [ ] `AdvancePhase` takes no catalog; top-set membership unchanged
      (tie widening, <10 distinct, zero submissions)
- [ ] `./scripts/ci-lint.sh` + `./scripts/ci-test.sh` green
