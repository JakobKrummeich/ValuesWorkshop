# CP-SAT Group Formation Model — ValuesWorkshop

Living document. Deviations discovered during implementation update this file
in the same PR (Ask-first).

This document specifies how **Group formation** (`design/domain-model.md`,
phase 5) is computed: the optimization model behind the `IGroupSolver` port,
implemented by the CP-SAT adapter in the Host. The domain term stays "Group
formation with its sizing rule and its aim"; solver, variables, and time-box
live here and nowhere else.

---

## 1. Inputs and outputs

Input, in domain terms:

- The present **participants**, each with their **value selection** (the
  value ids they picked in phase 3). Selected values outside the top set are
  ignored — they can never score.
- The **top values** — the V values that survived phase 4.

Output: the **groups**, each a set of members plus its assigned values.
Groups are ordered by the sizing rule (larger groups first), so the result
is deterministic and group index 0 is always a largest group. Naming
(animal names) and everything after formation is Task 18, not the solver.

Edges: N < 8 yields G = 1 — one trivial group holding everyone and all
values, through the same code path. N = 0 yields one empty group; V = 0
yields groups with no values. The solver never crashes on degenerate input;
what reaches users is decided by the caller.

## 2. Sizing rule (locked)

From `tasks/plan.md` (architecture decision 2); owned by `Domain`
(`GroupSizing`), the solver only honors the counts.

- Group count: `G = max(1, floor(N / 4))` for N participants.
- Participant counts per group: `floor(N / G)` each, the first `N mod G`
  groups get one extra. N=30 → G=7 → sizes 5,5,4,4,4,4,4.
- Value counts per group: same deal-out over the V top values —
  `floor(V / G)` each, the first `V mod G` groups get one extra.
  V=10, G=7 → 2,2,2,1,1,1,1.

The rule fixes only the cardinalities. Which participants and which values
land in which group is the solver's decision.

## 3. Decision variables

Index participants `p = 0..N-1` (roster order), values `v = 0..V-1`
(top-value order), groups `g = 0..G-1` (sizing-rule order). All variables
are Boolean.

| Variable | Meaning | Count |
|---|---|---|
| `x[p,g]` | participant p is in group g | N·G |
| `y[v,g]` | value v is assigned to group g | V·G |
| `z[p,v,g]` | p is in g **and** g holds v — created only for pairs (p,v) where p selected v | (Σ selections)·G |

`z` linearizes the product `x[p,g]·y[v,g]`. Creating it only where p
selected v keeps the model small: a pair p never selected can never
contribute to the objective, so it needs no variable.

## 4. Constraints

| Constraint | Formula | Domain meaning |
|---|---|---|
| Participant exactly-one | `Σ_g x[p,g] = 1` for every p | everyone is in exactly one group |
| Exact group sizes | `Σ_p x[p,g] = size(g)` for every g | sizing rule, participant side |
| Value exactly-one | `Σ_g y[v,g] = 1` for every v | each top value dealt to exactly one group |
| Exact value counts | `Σ_v y[v,g] = valueCount(g)` for every g | sizing rule, value side |
| Linearization | `z[p,v,g] ≤ x[p,g]` and `z[p,v,g] ≤ y[v,g]` | z can be 1 only if p is in g and g holds v |
| Participant capacity cut | `Σ_v z[p,v,g] ≤ min(\|sel(p)\|, valueCount(g)) · x[p,g]` for every p, g | redundant, tightens the relaxation: a participant scores nothing in a group they are not in, and never more than that group's value count |
| Value capacity cut | `Σ_p z[p,v,g] ≤ size(g) · y[v,g]` for every v, g | redundant, tightens the relaxation: a value scores nothing in a group it is not dealt to, and never more than that group's size |

The two capacity-cut families were added during implementation (deviation):
without them the LP bound stays near the trivial Σ\|sel\| and single-worker
search cannot close the gap — the adversarial N=30 benchmark stayed unproven
after 30 s. With the cuts plus `linearization_level:2` the same instance is
proven optimal in under one second.

The ≥ side of the linearization (`z ≥ x + y − 1`) is deliberately absent.
`z` appears only with positive coefficient in a maximization objective, so
the solver never leaves a `z` at 0 that the ≤ constraints would allow at 1:
for any fixed `x`/`y` assignment, setting every allowed `z` to 1 is optimal.
The reported objective therefore equals the true overlap.

## 5. Objective

```
maximize Σ z[p,v,g]
```

In domain terms: the total, over all participants, of how many of their own
selected values ended up in their own group — the formation aim of
`domain-model.md` (Σ_p |own selections ∩ own group's values|). Each
participant can contribute at most `min(|own selections ∩ top values|,
valueCount(their group))`.

## 6. Determinism and solver parameters

Same input must give the same output — reproducible `GroupsFormed`, stable
tests. Three ingredients:

- Deterministic model construction: participants, values, and groups are
  indexed in their given order (§ 3), so the model is byte-identical across
  runs.
- `random_seed` fixed, `num_search_workers = 1` — a single worker removes
  the nondeterminism of parallel portfolio search.
- `linearization_level = 2` (deviation from the default): the LP relaxation
  carries this model; with the default level the single worker wanders.
- `max_deterministic_time = 1.5` is the only cap (deviation): it counts
  solver work units, not wall time, so the interruption point — and with it
  the returned incumbent — is reproducible across runs and hosts. A wall cap
  that fires mid-search returns whatever incumbent the clock happened to
  land on; the `max_time_in_seconds = 2.5` safety net the first version
  carried did exactly that on a CI runner 1.5× slower than the dev box (two
  solves of one model, objective 38 vs 39) and was dropped in Task 31. The
  solver never reads a clock; the wall-clock policy is the formation window
  of `GroupFormationRunner` alone (`architecture.md`).
- Stopping is a hand-over, not an error: `Solve` returns a
  `GroupSolverOutcome` — `Assigned` with the best assignment found so far when
  its token is cancelled mid-search (CP-SAT `StopSearch`, status `FEASIBLE`),
  `StoppedWithoutAssignment` when it was stopped before the first feasible
  solution or before it started. Measured on the dev box with the single
  worker, the first solution appears after roughly 15 % of the cyclic N=30
  run and after 60 % of a sparse adversarial one, so a host too slow to reach
  it inside the window still ends with a random assignment.
- Optimality at workshop scale, measured (deviation from the original
  claim): dense structured instances (hand-worked N=8, disjoint-interest
  N=9, saturated N=30 with 6 selections in the top set) are proven
  `OPTIMAL` in well under a second. Sparse adversarial N=30 instances
  (3 selections each) exhaust the deterministic budget and return their
  best incumbent as `FEASIBLE` — a valid partition, a few points under the
  proven optimum (39 vs 42 on the benchmark), 1.7 s wall on the dev box.

## 7. Symmetry

Groups with equal member count and equal value count are interchangeable —
relabeling them yields a different assignment with the same objective. No
manual symmetry-breaking constraints are added: CP-SAT detects and breaks
model symmetries automatically in presolve (`symmetry_level`, default 2,
kept at default). Decision recorded per spec 17 review.

Fallback, documented only in case solve times ever demand it: manual
lexicographic label ordering — for each pair of adjacent equal-sized groups,
constrain the lowest participant index in group g to be smaller than the
lowest in group g+1. Measured during implementation: this fallback made
every benchmark slower (the cyclic N=30 proof went from 1.0 s to 2.1 s), so
it stays out.

## 8. Hand-worked example — N=8, V=6

Used verbatim as a solver test (slices 2/3). Each participant selects 3 of
the 6 values to keep the arithmetic checkable by hand; real workshops select
10 — the model does not care about the selection size.

Sizing: N=8 → `G = max(1, floor(8/4)) = 2`; participant sizes
`floor(8/2) = 4`, `8 mod 2 = 0` extras → 4+4. Values: `floor(6/2) = 3`,
`6 mod 2 = 0` extras → 3+3.

Participants a…h, values v1…v6, selections:

| Participant | Selects |
|---|---|
| a | v1, v2, v3 |
| b | v1, v2, v3 |
| c | v1, v2, v3 |
| d | v1, v2, v4 |
| e | v1, v4, v5 |
| f | v4, v5, v6 |
| g | v4, v5, v6 |
| h | v4, v5, v6 |

Tally (24 selections total): v1: 5 (a,b,c,d,e) · v2: 4 (a,b,c,d) ·
v3: 3 (a,b,c) · v4: 5 (d,e,f,g,h) · v5: 4 (e,f,g,h) · v6: 3 (f,g,h).

**Optimal assignment** (unique up to swapping the two group labels):

| Group | Members | Values | Per-member overlap |
|---|---|---|---|
| 1 | a, b, c, d | v1, v2, v3 | a: 3 · b: 3 · c: 3 · d: 2 (v1, v2) |
| 2 | e, f, g, h | v4, v5, v6 | e: 2 (v4, v5) · f: 3 · g: 3 · h: 3 |

Objective: `3+3+3+2 + 2+3+3+3 = 11 + 11 = 22` of a theoretical 24.

**Why no assignment beats 22:**

1. *24 is unreachable.* All eight would need overlap 3. For a to score 3,
   a's group must hold all of v1, v2, v3 — with exactly 3 values per group,
   that group's values are exactly {v1, v2, v3}, the other's {v4, v5, v6}.
   Then d (v1, v2, v4) scores at most 2 in either group.
2. *Any assignment where d scores 3 totals ≤ 17.* d at 3 forces d's group
   values to be exactly {v1, v2, v4}, the other group's {v3, v5, v6}. Every
   other participant then scores at most 2 wherever they sit (a, b, c:
   2 vs 1; e: 2 vs 1; f, g, h: 1 vs 2), so the total is at most
   `3 + 7·2 = 17`. Symmetrically for e (deal {v1, v4, v5} | {v2, v3, v6}):
   ≤ 17.
3. *Hence any assignment scoring above 17 has d ≤ 2 and e ≤ 2*, leaving at
   most `6·3 + 2 + 2 = 22`.
4. *22 forces the stated assignment.* Reaching 22 needs all of a, b, c, f,
   g, h at 3 and d, e at 2. Step 1's argument forces the deal
   {v1, v2, v3} | {v4, v5, v6}, with a, b, c in the first group and f, g, h
   in the second. The 4+4 sizes leave exactly one seat per group for d
   and e. d scores 2 only in the {v1, v2, v3} group (1 in the other);
   e scores 2 only in the {v4, v5, v6} group. The swapped placement of
   d and e totals `9 + 1 + 1 + 9 = 20`.

So the optimum is 22, attained by exactly one partition — the one above.
