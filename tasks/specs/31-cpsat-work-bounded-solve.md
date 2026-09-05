# Task 31 — Work-bounded group solve + incumbent hand-over

Origin: `Selections_outside_the_top_values_never_change_the_groups` falsified in
CI on PR #80 (replay `7991575445414587437,16086260887633055573,38`, a sparse
29-participant / 12-value request). `CpSatGroupSolver` ran under two caps,
`max_deterministic_time:1.5` and `max_time_in_seconds:2.5`; on a host ≥ 1.5×
slower than the dev VPS the wall cap fires first and the returned incumbent
depends on where the clock lands in the search (reproduced under CPU load:
objective 38 vs 39, then the long shrink CI showed). With the wall cap off the
same solve returned objective 41 at deterministic time 1.500 under any load.
Decision (Lavish, `.lavish/cpsat-flake-decision.html`): A + D in one PR, keep
the deterministic budget at 1.5.

## Decisions

- **D1 — the solver is bounded by work, never by the clock.** Parameters become
  `random_seed:42 num_search_workers:1 linearization_level:2
  max_deterministic_time:1.5`. Same input → same groups on every host. The
  formation window (`GroupFormationWindow`, 3 s) stays the only wall clock.
- **D2 — cancellation means "stop searching and hand over".** `IGroupSolver.Solve`
  keeps its parameters; when its token is cancelled the CP-SAT search stops and
  the best assignment found so far is handed over. Being stopped is not an
  error, so nothing is thrown: `Solve` returns the closed set
  `GroupSolverOutcome` — `Assigned(GroupFormationResult Assignment)` or
  `StoppedWithoutAssignment` (already cancelled on entry, or stopped before the
  first feasible solution). A search that ends by itself without an assignment
  is an invariant violation (every request has one) and still throws
  `InvalidOperationException`.
- **D3 — the runner adopts the incumbent when the window closes first.** When
  `FormGroupsIn` finds the run still solving, it stops the solve and waits for
  the hand-over for a bounded grace period (`HandOverGracePeriod`, 250 ms —
  CP-SAT returns within milliseconds of a stop; the bound only guards a solver
  that ignores it). Assignment handed over → groups from it, logged at
  information level. Nothing handed over → `RandomGroupAssignment` as today.
  Each run now carries its solve `Task`; the run is registered and its solve
  started under the runner lock, so a stop can never race a drop.
- **D4 — docs follow the behaviour.** `design/cpsat-model.md` § 6 (wall cap
  bullet → work-bounded + hand-over), `design/architecture.md` (runner
  paragraph, `IGroupSolver` contract), `design/domain-model.md` FormGroups,
  `design/state-machine.md` (Forming → Formed trigger, T11): "the solver's
  assignment — finished or its best so far when the window closes first; a
  random assignment stands in only when it has none".
- **D5 — tests.** Solver: a solve stopped mid-search hands over a valid
  partition and returns well before the full solve would (self-calibrated
  against a full solve of the same sparse request, so no absolute timing); a
  solve stopped before it started is `StoppedWithoutAssignment`. Runner: the
  window closing on a still-searching solver forms groups from what it hands
  over; a stopped solver with nothing to hand over → random; a solver ignoring
  the stop → random after the grace period (the existing blocked-solver test,
  renamed). Properties unchanged (`MaxTest` 8/15); no replay pinned — a
  machine-speed dependence cannot be caught on a fast box, the properties in CI
  remain the guard.

## Slices

1. D1 + solver contract D2 with tests (Host.Tests) — the flake fix.
2. D3 runner hand-over with tests (Application.Tests).
3. D4 docs + `tasks/todo.md` entry.

## Verification

`./scripts/test-backend-with-coverage.sh`, `./scripts/ci-lint.sh`,
`./scripts/ci-test.sh` (at-scale e2e forms 7 groups for 30 participants);
`Selections_outside_the_top_values_never_change_the_groups` with the CI replay
seed green under 8 busy-loop cores; gate + lightspeed; #80's CI turns green
after merge.
