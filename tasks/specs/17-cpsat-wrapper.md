# Spec 17 — CP-SAT grouping solver

## Objective

The group-formation brain becomes available to the backend: a solver
service that partitions participants into groups and deals the top
values out to those groups, maximizing how many of their own selected
values each participant gets to work on. Design doc first
(`design/cpsat-model.md`), then the implementation behind an
Application port wrapping Google OR-Tools CP-SAT (package already in
Host, 9.15.6755). Pure compute — no phase-5 wiring, no persistence, no
screens (all Task 18).

## Scope

### 1. `design/cpsat-model.md` (written and reviewed before code)

- Sizing rule (plan.md, locked): `G = max(1, floor(N/4))`; participant
  group sizes `floor(N/G)`, first `N mod G` groups +1; same deal-out
  for the V top values (`floor(V/G)`, first `V mod G` +1).
- Variables: `x[p,g] ∈ {0,1}` participant assignment, `y[v,g] ∈ {0,1}`
  value assignment, `z[p,v,g] ∈ {0,1}` linearization vars only for
  pairs where participant p selected value v.
- Constraints: each participant in exactly one group (Σ_g x[p,g] = 1);
  group sizes exact per sizing rule; each value in exactly one group;
  value counts per group exact; `z[p,v,g] ≤ x[p,g]`, `z[p,v,g] ≤
  y[v,g]` (maximization makes the ≥ side unnecessary).
- Objective: maximize Σ z — total overlap of own selections with own
  group's values.
- Symmetry: no manual symmetry-breaking constraints — CP-SAT detects
  and breaks model symmetries automatically in presolve
  (`symmetry_level`, default 2, kept at default); the doc records this
  decision and the fallback (manual label ordering) should solve times
  ever demand it.
- Hand-worked example N=8/V=6 (G=2, sizes 4+4, values 3+3) with the
  expected optimum, verifiable by hand; used verbatim as a test case.

### 2. Application port + Host adapter

- Port `IGroupSolver` in `Application/Ports/Driven/`, speaking domain
  language (Lavish decision): `ParticipantId`/`ValueId` value objects
  inside purpose-built records defined beside the port — request
  (participants with their selected `ValueId`s, top `ValueId`s) and
  result (groups as members + assigned values, deterministic
  sizing-rule order). Consistent with the port landscape:
  `ISessionRepository` speaks aggregates, content catalogs speak raw
  content records, and solver input/output is domain data — so domain
  value objects, but no aggregates (the solver needs no `Session`) and
  no OR-Tools types across the boundary.
- Adapter `CpSatGroupSolver` in Host (architecture.md places OR-Tools
  at the Host layer, catalog-loader precedent), registered in DI as
  the `IGroupSolver` implementation.
- Single-file library boundary (Lavish decision): exactly one file —
  `CpSatGroupSolver.cs` — imports `Google.OrTools`; it is the whole
  translation layer (domain-typed request → index-based model → solve
  → domain-typed result). Nothing else in the codebase may reference
  the library, so swapping solvers means one new class behind the same
  port. An architecture test (or lint gate) asserts the single-file
  import rule.
- Determinism: fixed random seed, `num_search_workers = 1`, best
  incumbent returned. Capping (measured during implementation, details
  in cpsat-model.md): `max_deterministic_time = 1.5` as the primary,
  reproducible cap + 2.5 s wall safety net — total stays inside the
  3 s budget; two redundant capacity cuts + `linearization_level = 2`
  make dense N=30 instances prove optimality in ~1 s. Selections
  outside the top set are ignored (they can never score).
- Edges: N < 8 → G = 1, trivial single group (still through the same
  code path); N = 0 or V = 0 → empty/degenerate result without
  crashing (Task 18 decides what reaches users).

### 3. Sizing rule in Domain

- `GroupSizing` (Domain): pure functions for group count + per-group
  participant/value counts — domain-model.md defines the rule, Domain
  owns it; the adapter consumes the counts.

## Out of scope

Phase-5 entry (`FormGroups`/I8), animal names, `Formation`/`Group`
aggregates, persistence, protocol/screens, late-joiner placement — all
Task 18. Solver parallelism tuning beyond the fixed single worker.

## Success criteria

- [ ] `design/cpsat-model.md` complete incl. hand-worked N=8/V=6
      optimum
- [ ] Sizing rule unit-tested: N=30 → 7 groups sized 5,5,4,4,4,4,4;
      N=4 → 1×4; N=7 → 1×7; N=8 → 2×4; value deal-out V=10/G=7 →
      2,2,2,1,1,1,1
- [ ] Solver returns a valid partition (all constraints hold) within
      3 s wall clock for N=30, V=10 (asserted in a test)
- [ ] Objective verified: the N=8/V=6 hand-worked instance reaches its
      known optimum; a second tiny instance with a unique optimal
      assignment reproduces it exactly
- [ ] Degenerate inputs (N=0, V=0, N<8) return well-formed results
- [ ] `./scripts/ci-lint.sh` + `./scripts/ci-test.sh` green

## Verification

`./scripts/ci-lint.sh` · `./scripts/ci-test.sh` (BE solver suite; FE
and e2e untouched)

## Slices (implementation order)

1. `design/cpsat-model.md` + Domain `GroupSizing` + tests.
2. `IGroupSolver` port + `CpSatGroupSolver` adapter + validity/time
   tests.
3. Objective-optimality tests (hand-worked instances) + degenerate
   edges.

## Decisions (for this review)

1. **Adapter placement: Host**, like the catalog loaders —
   architecture.md already pins OR-Tools to the Host layer; no new
   project for one adapter class.
2. **Determinism over speed:** fixed seed + single worker makes runs
   reproducible and tests stable; 3 s cap still lands N=30 easily.
3. **Port speaks domain language** (review): `ParticipantId`/`ValueId`
   value objects in purpose-built records — domain vocabulary without
   aggregates; no OR-Tools types across the boundary.
4. **Sizing rule lives in Domain** (`GroupSizing`), not in the
   adapter: it is business policy (domain-model.md glossary), the
   solver only honors it.
5. **No manual symmetry breaking** (review): CP-SAT's automatic
   symmetry detection (`symmetry_level` default 2) handles label
   symmetry; manual lexicographic ordering documented only as
   fallback.
