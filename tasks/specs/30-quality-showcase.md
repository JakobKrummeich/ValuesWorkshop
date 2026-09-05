# Task 30 — Engineering showcase: measured quality + generated diagrams

**Status:** approved in Lavish (session `9f56ad6ee783cd17`, ended by the user
with approval). Locked decisions:

1. README carries the headline table plus the three architecture diagrams
   inline; the full metrics table stays in `docs/quality/metrics.md`.
2. Shields.io badges at the top of the README: CI status, coverage, the
   complexity cap, duplication.
3. The ER diagram lives in `docs/quality/database.mmd`.
4. Extra tooling in scope: mutation testing (Stryker.NET + StrykerJS),
   property-based tests (FsCheck + fast-check), an axe-core accessibility gate
   in the e2e, CodeQL, SBOM + osv-scanner, and hotspot analysis over the git
   history. Out of scope for now: visual regression, bundle budget, load
   smoke, knip, process metrics, trends.

## Why

The README sells the workshop product (film, screenshots, how to run it) but
says nothing about how the thing is built, even though the repo's strongest
claim is its engineering: hexagonal on both sides, machine-checked layering,
a wire contract that cannot drift, complexity and duplication caps that fail
the build, ~38 k lines of tests against ~33 k lines of production code. A
reader currently has to take that on faith. This task measures it and shows
it — numbers that come from the tools themselves, and diagrams generated from
the code, never hand-drawn.

## Assumptions

1. Everything on display is **generated**, never typed by hand: a diagram or a
   number that a human maintains is a lie waiting to happen.
2. Mermaid is the diagram format. GitHub renders it inline in the README, the
   repo already uses it in `design/protocol.md` and `design/state-machine.md`,
   and it diffs as text.
3. Structural artifacts (layer graphs, database schema) change rarely and are
   **drift-gated** in CI, exactly like `contract/state/**` fixtures are today.
   Counting metrics (lines, tests, coverage) move with every commit, so they
   are stamped with the commit they describe and refreshed on demand — never
   gated, because a gate on them would fail on every unrelated PR.
4. No new heavyweight tooling: the numbers come from tools already in the
   gates (jest, coverlet, eslint, the VW1001/VW1002 analyzers, jscpd,
   dependency-cruiser, ArchUnitNET, pnpm audit) plus `git`.

## What ships

**One command:** `pnpm quality:report` regenerates every artifact below.

**`docs/quality/metrics.md`** — a measured table, stamped with the commit and
date it describes:

| group | what is measured |
| --- | --- |
| Size | production vs test lines per area, file counts by language |
| Tests | jest / xunit / Playwright test counts, FE + BE line coverage |
| Complexity | max and mean cyclomatic complexity per side against the cap of 7, longest file against the 300/600-line cap |
| Duplication | jscpd duplicated-token share against the 2 % cap |
| Architecture | dependency-cruiser rules, modules, dependencies, violations, cycles; ArchUnitNET rules; per-layer instability (`depcruise --metrics`) |
| Design system | design tokens, CSS modules, stylelint token enforcement, contrast-guard assertions |
| Contract | wire fixtures, contract assertions on both sides |
| Hotspots | churn × indentation complexity per production file over the whole git history, top 10 tabled |
| Security | FE advisory scan and BE vulnerable-package scan findings |
| Process | commits, merged PRs, every one of them through the same CI |

**Four generated diagrams** in `docs/quality/`:

- `repo-structure.mmd` — the repo's top-level map: which directory holds what
  and which ones the build gates read.
- `frontend-modules.mmd` — folder-level dependency graph of `frontend/src`,
  showing the hexagon: `app/*` → `domain`/`adapters`, the three screen groups
  mutually isolated. Built in 30b by folding dependency-cruiser's JSON report
  onto the architectural folders rather than by its mermaid reporter, which
  draws all 516 modules one by one.
- `backend-layers.mmd` — project graph parsed from the `.csproj` references:
  `Domain ← Application ← Adapters.* ← Host`, with the analyzer project wired
  into every one of them.
- `database.mmd` — a Mermaid `erDiagram` of all 17 tables with columns, keys
  and relations, emitted from the EF Core model itself (`IModel`), so it is
  the schema the application actually runs against, not a drawing of it.

The hotspot ranking is not a diagram: it is a table, written into `metrics.md`
and the README with the metrics, and like them it moves with every commit and
is not gated.

**Drift gate:** a test regenerates every diagram and fails when the checked-in
file differs, with the same `CONTRACT_WRITE=1`-style refresh path the wire
fixtures already use. In 30b/30c that landed as a jest test for the three
diagrams the frontend generates and an `Adapters.Tests` test, writing under
`DIAGRAM_WRITE=1`, for the one the EF Core model emits. `metrics.md` is not
gated.

**README:** a new `## Engineering` section between "Screenshots" and "Run the
demo" — the headline numbers as a short table, the three architecture
diagrams inline, one line each on what enforces them, and a link to
`docs/quality/metrics.md` for the full table. The table and the diagrams sit
in marked regions (`<!-- quality:<name>:start/end -->`) that
`pnpm quality:report` rewrites, so the README shows only what a tool measured.

## Tooling worth adding (your call, per line)

The list above only reports what the gates already know. These would each add a
new kind of evidence. Ordered by what they would prove about this repo:

| tool | what it would prove | cost |
| --- | --- | --- |
| **Mutation testing** — Stryker.NET + StrykerJS | that the 38 k lines of tests actually kill bugs, not just execute lines; a mutation score is the honest version of a coverage badge | slow (tens of minutes per side); run nightly or on demand, not per PR — landed in 30g, see below |
| **Property-based tests** — FsCheck (BE) + fast-check (FE) | see the explainer below: the domain invariants hold for *generated* inputs, not just for the examples someone thought of | small; a handful of properties next to the example tests |
| **Accessibility gate** — axe-core inside the Playwright e2e | the three shells are actually usable: contrast, roles, focus order, live regions — the design system already guards contrast, this guards the rest | small; one assertion per screen in the existing e2e — landed in 30f, see below |
| **Visual regression** — Playwright screenshot diffs over all 27 screens | that a CSS change cannot silently wreck a screen; the redesign would have been caught by it twice | medium; needs stable seeds and a baseline set (~30 PNGs) |
| **Bundle budget** — Next build stats + size-limit | the phone stays light: first-load JS per route against a budget that fails the build | small |
| **Load smoke** — k6 or bombardier against the hub | the SignalR fan-out holds a real room: 200 participants, p95 broadcast latency, memory flat over a full workshop | medium; needs a scripted room and a machine to trust the numbers |
| **CodeQL** | security analysis on both languages, free on GitHub, findings as PR checks | tiny; a workflow file — landed in 30h, see below |
| **SBOM + OSV** — CycloneDX + osv-scanner | supply chain: what is actually in the image, scanned against a real advisory database rather than pnpm audit alone | small — landed in 30h, see below |
| **Dead-code detection** — knip (FE) | no unused exports, dependencies or files accumulate | small; likely a one-off cleanup then a gate |
| **Hotspot analysis** — code-maat over the git history | where complexity and churn overlap, which is where the next bug will be; makes a striking README picture | small; read-only over history — landed in 30i with plain `git` instead of code-maat, see below |
| **Process metrics** — from git + the GitHub API | PR cycle time, CI duration, first-try pass rate, flake rate | small |
| **Trend over time** | every metric recomputed per release so the README can show a direction, not a snapshot | medium; needs a stored series |

### What property-based testing is

A normal test names one case: "25 participants form 7 groups of 3 or 4". You
chose that number, so the test only knows what you already suspected.

A property-based test names a **rule that must hold for every input**, and the
library generates the inputs — hundreds of random ones per run, deliberately
including the nasty ones (0, 1, 2, huge, duplicates). When it finds a failure it
*shrinks* it to the smallest example that still fails, so the report reads
"fails at 7 participants" instead of "fails at 431 participants named …".

For this repo the rules already exist as written invariants, which is exactly
what makes it a good fit:

- for **any** participant count, the formed groups differ by at most one member,
  every participant is in exactly one group, and no group is empty;
- for **any** sequence of legal intents, the phase only ever moves forward and
  the revision only ever increases;
- for **any** selection, exactly ten values survive; for any vote, exactly five
  are spent; for any group, exactly one scribe.

The CP-SAT group solver is the strongest case: a constraint solver is precisely
the kind of code where a random sweep finds the edge case nobody wrote a test
for. FsCheck is the C# library for this, fast-check the TypeScript one; both run
inside the existing test suites and add seconds, not minutes.

In 30e that landed as 25 FsCheck properties over group sizing, the selection
round, the voting rounds, phase progression under generated intent sequences and
the CP-SAT solver, plus 22 fast-check properties over the frontend's own
derivations — the selection chart, the presentation position, the group
formation view, the plural message key and the action slab scale. Backend
generators live in `backend/TestSupport/WorkshopGenerators.cs`; the solver
properties run at a lowered `MaxTest` because each case calls a real solve. The
whole sweep adds about 11 s to the backend suite and under a second to jest.

### How the mutation testing landed

30g runs Stryker.NET 4.16.0 over the backend and StrykerJS 10.0.0 over the
frontend through `pnpm mutation`, or one side at a time with
`pnpm mutation:frontend` and `pnpm mutation:backend`. Each side takes tens of
minutes, so it is not a PR gate: `.github/workflows/mutation.yml` runs both
nightly and on demand. The result lands in `docs/quality/mutation.json` and is
rendered from there into `metrics.md` and the README's headline table. The
first full runs scored the backend at 84.59 % (1,223 killed, 198 survived, 1
timeout, 25 without coverage) and the frontend at 86.43 % (2,136 killed, 296
survived, 4 timeouts, 40 without coverage); the first backend run uncovered
real gaps in the tests, closed before the score was recorded ("Close the gaps
the first mutation run uncovered"). An uncapped run peaked at 14 GB and
OOM-killed the whole session twice, so a run now executes inside
`systemd-run --user --scope -p MemoryMax=8G -p MemorySwapMax=2G` under
`choom -n 900`, with two test runners per side (`maxTestRunnerReuse: 20`,
`NODE_OPTIONS=--max-old-space-size=1536` for jest) — a run dies before the
machine does.

### How the accessibility gate landed

30f scans all three shells in every phase of the restart-recovery walkthrough,
plus the lobby wall, the session-less wall and the two refused-facilitator
screens, against the WCAG 2.0/2.1 A and AA rule tags. Serious and critical
violations fail the run; no rule is excluded and no violation is suppressed. The
first run found six real defects — a moss ramp that only reached 3.5:1 on white,
a status pill whose pulse animation sampled at 2.03:1, a tablist wrapped in list
items, and three unnamed progress bars — and all six were fixed in the product. A scan waits for one-shot entrance
animations and transitions to finish before it measures — axe otherwise samples
a phase screen mid-fade, where a muted label at 85 % opacity reads 4.15:1 — while
infinite animations such as the connection pulse stay under test.

### How the supply chain slice landed

30h added a CodeQL workflow for both languages
(`.github/workflows/codeql.yml`), CycloneDX bills of materials for both sides
in `docs/quality/sbom/` (`pnpm run sbom`), and osv-scanner 2.5.1, pinned by
checksum in `scripts/install-osv-scanner.sh`, scanning `pnpm-lock.yaml` plus
both SBOMs from `./scripts/ci-lint.sh`. The scan fails closed: it makes four
attempts with a 5/15/45 s backoff, and when the advisory database stays
unreachable it exits 1 — "the dependency tree is unscanned" — rather than
passing. That was proven end to end by running it behind a dead proxy: the
binary's exit 127 became the gate's exit 1.

### How the hotspot analysis landed

30i uses nothing but `git` and file reading, in keeping with assumption 4.
Churn is read from `git log --numstat --no-renames --format=%H <measured sha>`:
commits and changed lines per path as it is named today, over the whole
history, binary rows skipped. Complexity is Tornhill-style whitespace
analysis: every non-blank line of a production `.cs`, `.ts` or `.tsx` file adds
its nesting depth, at four spaces per level for C# and two for TypeScript, a
tab counting as one level. The score is commits × complexity. One table
renders the top ten: `metrics.md` shows every column under `## Hotspots`, the
README's `hotspots` region the same rows without the deepest nesting. A chart
was tried and dropped: with real data a Mermaid quadrant chart clumps every
point at half the complexity axis with colliding labels, and a bar chart
truncates the file names, so neither said more than the table does. The table
is not drift-gated because it moves with every commit.

### How the README section landed

30d put badges under the title — the CI workflow badge and four shields.io
dynamic-JSON badges reading `docs/quality/metrics.json` on `main` for frontend
coverage, backend coverage, the complexity cap and duplication — and a
`## Engineering` section whose headline table, three diagrams and hotspots
table live in marked regions that `pnpm quality:report` rewrites from the
report and the generated `.mmd` files. The lines inside those regions are
left out of the size counts, so a regeneration cannot move its own numbers. The drift gate now also checks
the README's copies of the three structural diagrams, and `design/architecture.md`
and `design/persistence.md` point at their generated counterparts.

My recommendation: **mutation testing, property-based tests, the accessibility
gate and CodeQL** — each proves something the current gates cannot, and none of
them is decorative. Visual regression is the strongest of the rest, but it only
pays off once the design stops moving.

## Slices

Each slice is its own PR off `main`, merged before the next one starts.

- **30a** metrics collector + `docs/quality/metrics.md` (S/M)
- **30b** repo, frontend and backend diagrams + drift gate (M)
- **30c** database ER diagram from the EF model + drift gate (S/M)
- **30d** README `## Engineering` section, badges, cross-links from `design/` (S)
- **30e** property-based tests for the domain invariants — FsCheck + fast-check (M)
- **30f** accessibility gate — axe-core assertions in the Playwright e2e (M)
- **30g** mutation testing — Stryker.NET + StrykerJS, score in the metrics table,
  run on demand and nightly rather than per PR (M/L)
- **30h** supply chain — CodeQL workflow, CycloneDX SBOM, osv-scanner (S/M)
- **30i** hotspot analysis — churn × complexity over the git history, rendered
  for the README (S/M)

## Acceptance criteria

- `pnpm quality:report` regenerates every artifact; running it twice in a row
  produces no diff.
- Every number in `metrics.md` traces to a tool invocation recorded in the
  file; none is hand-written.
- The drift gate fails when a table, a project reference or a module edge
  changes without regenerating; `./scripts/ci-lint.sh` and `./scripts/ci-test.sh`
  stay green.
- The README inlines the three architecture diagrams, rendered by GitHub
  without a build step, and links the ER diagram.
- The collector's parsing is unit-tested against captured tool output.

## Open questions for the reviewer

1. **Scope of the README section** — headline table plus three diagrams, or
   the full metrics table inline?
2. **Badges** — add shields.io badges (CI status, coverage, complexity cap) at
   the top of the README, or keep it prose and tables?
3. **Where the ER diagram lives** — `docs/quality/database.mmd` as proposed,
   or inside `design/persistence.md` next to the persistence design, embedded
   in the README from there?
