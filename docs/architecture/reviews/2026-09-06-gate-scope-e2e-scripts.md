# Fence the third TypeScript tree: `e2e/` and `scripts/` sit outside every gate

**Date:** 2026-09-06
**Scope:** `e2e/**` (23 files), `scripts/{demoWorkshop,demoVideo,demoMedia}/**`,
`playwright.config.ts`, `playwright.demoMedia.config.ts`,
`playwright.demoVideo.config.ts`, and the five configuration files that draw the
gate boundary: `frontend/tsconfig.json`, `frontend/scripts/tsconfig.json`,
`frontend/eslint.config.mjs`, `frontend/package.json` (`lint`, `typecheck`),
`.jscpd.json`; plus `scripts/ci-lint.sh`, `scripts/pre-commit`,
`.github/workflows/ci.yml` and `frontend/scripts/quality/sizeScan.mts`
**Status:** Proposed — needs a human decision, no code was changed

---

## 1. Context

The evidence run for 2026-09-06 shows the same healthy picture as last week
where the gates reach. Every top temporal-coupling pair is a production module
with its own test project (`backend/Application` ↔ `backend/Application.Tests`,
62 co-changes, support 0.73; `backend/Domain` ↔ `backend/Domain.Tests`, 54,
0.78) — that is TDD. The frontend role triangle (`facilitator` ↔ `presenter`
44, ↔ `participant` 43, `participant` ↔ `presenter` 40) is, on inspection of
the commits behind it, the visual-system rollout of Task 29 (`8e568af`
"ScreenCopy and FormationProgress: one place for heading-plus-body copy",
`5122ac6` "Tokens: every card shadow reads `--shadow-card`", `1aac45b`
"ProgressRing replaces FormationProgressBar") landing in three role views —
inherent to the product, already fenced by six `*-must-not-import-*` rules, and
already ruled a non-goal by the 2026-08-30 proposal. Nothing there changed.

The signal this week is not in the coupling table. It is in the churn table and
the god-file table, and it is confirmed by reading the configuration files:

| Module        | commits 90d | files | LOC   | added 90d |
| ------------- | ----------: | ----: | ----: | --------: |
| `e2e`         |          59 |     9 | 3,043 |     3,657 |
| `e2e/support` |          18 |    14 |   607 |       671 |
| `scripts*`    |          28 |    22 | 2,267 |     2,733 |

`e2e` alone changed 59 times in 90 days — as often as `backend/Host.Tests`,
more often than `backend/Adapters.Persistence` — spread over **nine** files.
And section 5 of the evidence shows that the three largest TypeScript files in
the entire repository live there:

```
889  e2e/workshopAtScale.spec.ts
728  e2e/restartRecovery.spec.ts
616  e2e/selectionPhase.spec.ts
```

The largest file inside the fenced trees is 448 lines
(`frontend/src/domain/__tests__/participantWorkshopState.test.ts`), because
`frontend/eslint.config.mjs` caps test files at 600 counted lines and
`backend/Analyzers/FileLengthAnalyzer.cs` caps `*.Tests` assemblies at the
same 600. The three specs above are not exceptions to that rule. They are
outside its reach.

Counting the whole tree, from this checkout at `d908947`:

```bash
git ls-files '*.ts' '*.tsx' '*.mts' '*.cts' | wc -l            # 550
frontend/node_modules/.bin/tsc -p frontend/tsconfig.json --listFilesOnly
frontend/node_modules/.bin/tsc -p frontend/scripts/tsconfig.json --listFilesOnly
```

**37 of 550 tracked TypeScript files (6.7 %) belong to no tsconfig project**:
23 under `e2e/`, 11 under `scripts/`, and the three `playwright*.config.ts`
files at the root.

---

## 2. Finding

**Every quality gate in this repository is scoped by a directory literal
(`frontend/`, `backend/`), and the code no longer lives only in those two
directories. The `e2e/` + root `scripts/` TypeScript tree — 33 files, 5,222
lines by jscpd's count — is type-checked by nothing, linted by nothing,
format-checked by nothing, and duplication-scanned by nothing.**

The boundary is drawn six times, each time by naming a directory:

| Gate                     | Where the scope is written                          | What it covers                          |
| ------------------------ | --------------------------------------------------- | --------------------------------------- |
| `tsc`                    | `frontend/package.json`: `tsc --noEmit && tsc --noEmit --project scripts` | `frontend/**`, `frontend/scripts/**`    |
| eslint                   | `frontend/eslint.config.mjs`, run as `eslint` with cwd `frontend`         | `frontend/**`                            |
| prettier                 | `frontend/package.json`: `prettier --check .`, cwd `frontend`             | `frontend/**`                            |
| dependency-cruiser       | `frontend/package.json`: `depcruise src`                                  | `frontend/src/**`                        |
| jscpd                    | `.jscpd.json`: `"path": ["frontend/src", "backend"]`                      | `frontend/src/**`, `backend/**`          |
| VW1001/VW1002 analyzers  | `backend/Directory.Build.props` (MSBuild)                                 | `backend/**` C#                          |

`scripts/pre-commit` completes the picture: it formats
`grep '^frontend/'` and `grep '^backend/.*\.cs$'` and nothing else, so root
TypeScript is not even auto-formatted on the way in. `.github/workflows/ci.yml`
has no static step for the tree either — its `e2e` job runs
`scripts/ci-e2e.sh`, which is `docker compose up` plus `pnpm exec playwright
test`.

**Playwright does not type-check.** It transpiles. Verified rather than
assumed, with a throwaway project outside this repository:

```typescript
const brokenOnPurpose: number = "this is a string, not a number";

test("a spec whose types do not check is still collected", async () => {
  expect(brokenOnPurpose).toBeDefined();
});
```

```
$ playwright test --list
  typeError.spec.ts:5:5 › a spec whose types do not check is still collected
  Total: 1 test in 1 file          # exit 0
```

So the only feedback a rename in `e2e/support/` produces today is a Playwright
failure — after `docker compose up --wait`, in the slowest gate the project
owns, as a 30-second timeout on a selector rather than a compiler error naming
the symbol.

### The drift has already started

Three concrete symptoms on `main` today:

1. **A shared module with three private copies.** `e2e/support/viewports.ts`
   exports `PHONE_VIEWPORT`, `LAPTOP_VIEWPORT`, `WALL_VIEWPORT`. Three specs
   re-declare the same values locally instead of importing them:
   `e2e/quizPhase.spec.ts:25-26`, `e2e/selectionPhase.spec.ts:20-21`,
   `e2e/restartRecovery.spec.ts:39-40`. Only `e2e/workshopAtScale.spec.ts:33`
   and the demo scripts (`scripts/demoVideo/composeFilmFrames.ts:12`,
   `scripts/demoMedia/captureDemoMedia.spec.ts:13`) import the module. Four
   copies of one viewport constant is precisely the latent divergence
   `.maintenance-agent.yaml`'s duplication analyzer note calls out — "clones
   that must stay in sync are latent divergence bugs". Honest detail: these
   two-line copies sit under jscpd's `minTokens: 50` floor, so even a scanned
   tree would not flag them; what flags them elsewhere is a reviewer or an
   agent grepping a symbol and finding one definition. In this tree there are
   four, and nothing at all reports it.

2. **A 66-line clone of the workshop-opening fixture.** Running the repo's own
   duplication gate over the unfenced tree:

   ```bash
   node_modules/.bin/jscpd --min-tokens 50 --format typescript e2e scripts
   ```

   ```
   │ typescript │ 33 files │ 5,222 lines │ 11 clones │ 170 duplicated lines (3.26%) │
   ERROR: jscpd found too many duplicates (3.26%) over threshold (2%)
   ```

   3.26 % against the repo's own 2 % threshold, and the biggest clone is
   `e2e/quizPhase.spec.ts` [28:36–94:8] ↔ `e2e/selectionPhase.spec.ts`
   [76:63–142:11] — 66 lines, 588 tokens: the entire `test.beforeAll` that
   opens the browser contexts, calls `openSignedIn` and
   `openSessionAsFacilitator`, walks `signInThroughOidcProvider` per
   participant and opens the presenter wall. `e2e/support/` already holds
   `facilitatorSession.ts`, `participantSession.ts` and `oidcLogin.ts`; the
   fixture that composes them was copied instead of named. Two more clones
   (`joinPhase` ↔ `sessionLifecycle`, `localeFlip` ↔ `sessionLifecycle`) are
   the same fixture at smaller scale.

3. **Two files that prettier would rewrite** — `e2e/support/participantAccounts.ts`
   and `scripts/md-to-lavish-html.mjs` — in a repository where formatting is
   both a CI gate and a pre-commit hook.

### What adoption would cost, measured

Applying the repo's own rules to the tree with a throwaway flat config
(`complexity: ["error", 7]`, `id-match`, `max-lines` 600 for specs / 300 for
support and scripts) reports **three** violations, all `max-lines`:

```
e2e/restartRecovery.spec.ts              625 lines (max 600)
e2e/workshopAtScale.spec.ts              788 lines (max 600)
scripts/demoWorkshop/driveDemoWorkshop.ts 405 lines (max 300)
```

Zero complexity violations. Zero `id-match` violations. And `tsc --strict
--noEmit` over all 37 files passes clean, exit 0. The tree is three files away
from meeting the standard the rest of the repository already meets — which is
the strongest argument that fencing it now is cheap and that waiting is what
makes it expensive.

### Blast radius

- **This tree is the only system-level check of the FE/BE seam.** The
  2026-08-30 proposal (adopted, implemented) fenced the wire contract with
  checked-in fixtures asserted by unit tests on both sides. What those fixtures
  cannot see — a hub call that reaches the server but leaves the UI in the
  wrong state — is checked only by the 93 Playwright journeys in this tree.
- **The accessibility gate lives here** (`e2e/support/accessibility.ts`, 95
  lines), as does the restart-recovery evidence for the persistence design
  (`e2e/restartRecovery.spec.ts`).
- **The demo/media pipeline imports it.** `scripts/demoWorkshop/driveDemoWorkshop.ts`
  imports nine modules from `../../e2e/support/*`; `pnpm demo:media` and
  `pnpm demo:video` produce `docs/media/demo.gif`, `demo.mp4` and the README
  screenshots from that driver. Decay in `e2e/support` is not test-only decay.
- **The published numbers describe two trees out of three.** README's
  Engineering section states "A function above cyclomatic complexity 7, a
  production file beyond 300 lines or duplication beyond 2 % fails the build",
  and its generated headline row reads "Duplicated tokens | 0.13 % (at most
  2 %) | … | `jscpd`, one scan over both sides". Both sentences are true of
  `frontend/` and `backend/`. Measured over `e2e` + `scripts`, duplication is
  3.26 %. The gap is structural, not editorial:
  `frontend/scripts/quality/sizeScan.mts:138` defines
  `sideOf()` as `backend/` → Backend, `frontend/` → Frontend, `undefined`
  otherwise — so the longest-file table in `docs/quality/metrics.md` (lines
  117-120) *cannot* show an `e2e` file, while the size table three sections
  earlier counts `e2e` as 23 files and 3,650 lines of test code.

Honest severity note: this is test and tooling code. A defect here costs a red
or flaky gate, not a broken workshop. It ranks first this week anyway because
it is the last unfenced tree in a repository whose stated product claim is
machine-checked quality, because the repair is verified-cheap (see § 3), and
because the trend is unambiguous: 3,657 lines added to nine files in 90 days,
with the first four copies of a shared constant already in place.

---

## 3. Proposal

### Target state

Gate scope is defined by "TypeScript this repository tracks", not by two
directory names. Concretely:

```
tsconfig.json          (new, root)   e2e/**, scripts/**/*.ts, playwright*.config.ts
eslint.config.mjs      (new, root)   same tree: complexity 7, id-match, max-lines
.prettierrc            (new, root)   same content as frontend/.prettierrc
.jscpd.json            (edited)      path: [frontend/src, backend, e2e, scripts]
scripts/ci-lint.sh     (edited)      one "root tree" section calling the three
scripts/pre-commit     (edited)      formats root TypeScript too
```

plus one test that fails when a tracked `.ts`/`.tsx`/`.mts` file belongs to no
tsconfig project (§ 4), so the next tree that is born outside the fence is
reported on the day it is born rather than 5,000 lines later.

Everything stays literal and greppable: the projects are named as strings in
one array, the gate scripts are the ones that already exist, and no
`e2e/**` file changes behaviour.

### Stepwise plan

`.maintenance-agent.yaml` caps a daily run at a 200-line diff; every step below
is sized against that and lands green on its own. Steps 1–3 are pure
configuration and are already green today (measured, § 2). Steps 4–6 are
behaviour-preserving refactors of the tree, each verified by the e2e suite the
delivery pipeline runs anyway. Step 7 closes the loop on the published numbers.

1. **Root `tsconfig.json` + typecheck gate** (~35 lines plus a lockfile entry).
   `strict`, `noEmit`, `moduleResolution: bundler`, `types: ["node"]`, include
   `e2e/**/*.ts`, `scripts/**/*.ts`, `playwright*.config.ts`; a root
   `"typecheck": "tsc --noEmit"` script; one line in `scripts/ci-lint.sh` and
   one step in `.github/workflows/ci.yml`. One non-obvious prerequisite,
   verified the hard way: the root `node_modules/@types` holds only
   `pdf-parse` and `pngjs`, so `@types/node` (`^20`, the version `frontend/`
   already resolves) must join the root `devDependencies` or `tsc` stops at
   `TS2688: Cannot find type definition file for 'node'`. Verified with those
   settings: 37 files, 0 errors, 1.6 s.
2. **Root prettier scope** (~70 lines, of which 36 are the reformat). Root
   `.prettierrc` (copy of `frontend/.prettierrc`) and a root
   `"fmt:check": "prettier --check 'e2e/**/*.ts' 'scripts/**/*.{ts,mjs}'
   'playwright*.config.ts'"` — scoped by glob rather than `.`, because a root
   `prettier --check .` would also reach the hand-written markdown in `design/`
   and `tasks/`, which are protected records, not formatted artefacts. Then the
   `ci-lint.sh` line, the two files reformatted
   (`e2e/support/participantAccounts.ts` 7 lines,
   `scripts/md-to-lavish-html.mjs` 29 lines), and the `^frontend/` filter in
   `scripts/pre-commit` widened to the same globs.
3. **Root `eslint.config.mjs`** (~45 lines). `complexity: ["error", 7]` and
   `id-match` over `e2e/**`, `scripts/**`, `playwright*.config.ts`; `max-lines`
   300 over `e2e/support/**` only (the largest is `quizFastForward.ts` at 101,
   so it passes today); the `ci-lint.sh` line. Deliberately no `max-lines` on
   the specs yet — steps 4-6 earn it — and none on `scripts/**`, where
   `driveDemoWorkshop.ts` stands at 405. Verified: 0 violations under this
   exact rule set.
4. **Use the shared viewports** (~15 lines). Delete the local
   `PHONE_VIEWPORT`/`WALL_VIEWPORT` pairs in `quizPhase.spec.ts`,
   `selectionPhase.spec.ts` and `restartRecovery.spec.ts`; import from
   `e2e/support/viewports.ts`, as `workshopAtScale.spec.ts` already does.
5. **Name the workshop-opening fixture** (~120 lines per spec, one spec per
   run). Add `e2e/support/workshopSession.ts` exporting
   `openWorkshopWithParticipants(browser, { sessionName, accounts })` returning
   `{ facilitatorPage, participantPages, presenterPage, sessionIdentity,
   closeAll }`, composed from the existing `openSignedIn`,
   `openSessionAsFacilitator`, `signInThroughOidcProvider`. Adopt it in
   `quizPhase.spec.ts` first, `selectionPhase.spec.ts` next; `joinPhase`,
   `localeFlip` and `sessionLifecycle` follow the same way. This removes the
   66-line clone and roughly 100 of the 170 duplicated lines.
6. **Move journey helpers into `e2e/support/`** (~150 lines per run, 2 runs).
   From `workshopAtScale.spec.ts`: `maximalLengthActionTextOf`, `inBatches`,
   `wallCardCounts`, `expectWallToCycleThroughBothPages`, `mainRoundBallotOf`,
   `expectedActionTextsOf`, `expectWorstCaseRevealToFitTheWall` (~115 lines of
   helpers plus their constants). From `restartRecovery.spec.ts`:
   `reopenFacilitatorTab`, `reopenParticipantTab`, `workshopScreens`,
   `scribeSelectedOption`, `ballotOf` and the two path helpers (~45 lines),
   which brings 625 under 600. The two
   `test.describe.serial` journeys stay single files — they share page state
   across their tests by design and splitting the journey would re-run a
   30-browser setup (see § 5).
7. **Extend the duplication scan and the report** (~40 lines). `.jscpd.json`
   `path` becomes `["frontend/src", "backend", "e2e", "scripts"]` once steps
   4-6 have brought the tree under 2 %; `max-lines` for `e2e/**/*.spec.ts` is
   set in the root eslint config to whatever the tree then measures (≤ 800,
   with the serial-journey reason written beside it); `sizeScan.mts` learns a
   third `RepositorySide` so `docs/quality/metrics.md` and the README headline
   describe all three trees, and `pnpm quality:report` is re-run. The 300-line
   ceiling for `scripts/**` waits for a later run that moves
   `driveDemoWorkshop.ts`'s per-moment blocks into their own module.

If the human stops after step 3, the repository has gained type checking,
linting and formatting over 5,222 previously unchecked lines for ~150 lines of
configuration — that alone pays.

---

## 4. Fitness function

The rule that must survive is not "eslint runs on `e2e/`" — that is one config
line, and a config line is exactly what eroded here. The invariant is
**no tracked TypeScript file is outside every tsconfig project**, which is the
silent-registration completeness test from the maintainability skill applied to
gate scope. It belongs where jest already runs `.mts` tests
(`frontend/scripts/__tests__/*.test.mts`, executed by `pnpm --dir frontend
test`, an existing gate).

`frontend/scripts/__tests__/typeScriptGateCoverage.test.mts`:

```typescript
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { relative, resolve } from "node:path";

const repositoryRoot = resolve(__dirname, "../../..");
const typeScriptCompiler = resolve(
  repositoryRoot,
  "frontend/node_modules/.bin/tsc",
);

// Every project that type-checks part of this repository, by literal path.
const TYPE_CHECKED_PROJECTS = [
  "tsconfig.json",
  "frontend/tsconfig.json",
  "frontend/scripts/tsconfig.json",
];

function run(command: string, argumentList: string[]): string {
  return execFileSync(command, argumentList, {
    cwd: repositoryRoot,
    encoding: "utf8",
    maxBuffer: 32 * 1024 * 1024,
  });
}

function trackedTypeScriptFiles(): string[] {
  return run("git", ["ls-files", "*.ts", "*.tsx", "*.mts", "*.cts"])
    .split("\n")
    .filter((path) => path.length > 0);
}

function filesSeenBy(project: string): string[] {
  // --listFilesOnly resolves the program without type-checking it: ~1 s.
  return run(typeScriptCompiler, ["-p", project, "--listFilesOnly"])
    .split("\n")
    .map((path) => path.trim())
    .filter((path) => path.startsWith(repositoryRoot))
    .map((path) => relative(repositoryRoot, path));
}

describe("the gates cover every tracked TypeScript file", () => {
  it(
    "puts every tracked TypeScript file in some tsconfig project",
    () => {
      const covered = new Set(TYPE_CHECKED_PROJECTS.flatMap(filesSeenBy));

      const unchecked = trackedTypeScriptFiles().filter(
        (path) => !covered.has(path),
      );

      expect(unchecked).toEqual([]);
    },
    30_000,
  );

  it("scans every top-level directory holding TypeScript for duplication", () => {
    const scanned: string[] = JSON.parse(
      readFileSync(resolve(repositoryRoot, ".jscpd.json"), "utf8"),
    ).path.map((path: string) => path.split("/")[0]);

    const holdingTypeScript = new Set(
      trackedTypeScriptFiles().map((path) => path.split("/")[0]),
    );

    expect(
      [...holdingTypeScript].filter((directory) => !scanned.includes(directory)),
    ).toEqual([]);
  });
});
```

Properties that matter:

- **It fails today**, listing all 37 files — so it can only be added in step 1,
  together with the root `tsconfig.json` that makes it pass. That ordering is
  the proof the step worked.
- **It fails on the next unfenced tree**, whatever it is called: a new
  `tools/`, `perf/` or `migrations/` directory of TypeScript is reported by
  name on its first commit, with no config to remember to update.
- **It is greppable.** Searching `tsconfig.json` or `.jscpd.json` lands on
  `TYPE_CHECKED_PROJECTS` and on the scan-path assertion — the gate scope is
  written as literal strings in one file, not derived by convention.
- **It is cheap.** Measured on this checkout: `tsc --listFilesOnly` takes 1.7 s
  for `frontend/tsconfig.json`, 0.7 s for `frontend/scripts/tsconfig.json` and
  1.6 s for the proposed root project; the second test costs one
  `git ls-files`.

Note the honest limit: this locks *type-check and duplication* scope. Lint and
format scope are locked only by steps 2-3 wiring them into `scripts/ci-lint.sh`
(the same place the other gates already live) — a second assertion over
`eslint --print-config` was considered and rejected as slow and brittle for the
value it adds.

---

## 5. Alternatives rejected

- **Move `e2e/` under `frontend/` so the existing configs pick it up.**
  Rejected. Jest's default `testMatch` collects `**/?(*.)+(spec|test).[jt]s?(x)`
  with `rootDir: frontend`, so `pnpm --dir frontend test` would start collecting
  Playwright specs and fail on `@playwright/test` imports in jsdom. Beyond the
  collision: this suite drives three roles through a real browser against the
  composed docker stack, `playwright.config.ts`, `docker-compose.e2e.yml` and
  `scripts/demo*` all sit at the root by design, and `scripts/ci-e2e.sh` runs
  it as a separate CI job. The tree's location is right; its fence is missing.
- **Add `../e2e` to `frontend/tsconfig.json`'s `include`.** Rejected: that
  program is what `next build` type-checks, it carries the `@/*` path aliases
  and the Next.js plugin, and dragging Playwright's globals into it would slow
  and pollute the production build's check. A separate root project is what
  multiple TypeScript programs are for.
- **Only split the three oversized files (a daily-agent-sized fix).** Rejected
  as the primary answer: it treats the symptom the god-file table shows and
  leaves the cause — nothing measures the next file. The daily agent would fix
  `workshopAtScale.spec.ts` and, a month later, `workshopAtScale2.spec.ts`.
  Splitting is in this plan (step 6), but *after* the fence, so the ceiling is
  enforced from then on.
- **Split the two serial journeys into several spec files.** Rejected.
  `workshopAtScale.spec.ts` and `restartRecovery.spec.ts` are
  `test.describe.serial` blocks whose tests share browser contexts and a live
  session across the whole 9-phase workshop; splitting them into files means
  re-driving the journey per file — for the 30-participant suite that is the
  most expensive fixture in the repository. Extracting helpers (step 6) buys
  most of the size reduction without paying that.
- **Trust the running Playwright suite as the gate.** Rejected with evidence:
  § 2 shows a spec with a plain type error is collected and run. The suite
  checks the paths a scenario walks, after `docker compose up`, in minutes;
  `tsc` checks every symbol in every file in one second.
- **Do nothing — it is only test code.** Defensible on severity alone, and
  stated as such in § 2. It stops being defensible given the direction of
  travel: four copies of the viewport constants, an 11-clone / 3.26 %
  duplication reading, two unformatted files, and 3,657 lines added to nine
  files in 90 days — all of it invisible to the report the README publishes as
  the project's engineering claim.

---

## 6. Non-goals

- **No new end-to-end coverage, no scenario changes.** Every step is
  behaviour-preserving; the same 93 journeys assert the same things afterwards.
- **No change to the `frontend/` or `backend/` gate configuration or its
  thresholds.** The root configs mirror the existing limits; they do not
  re-open them.
- **No page-object rewrite of the e2e suite.** `e2e/support/` already is the
  shared layer; steps 4-6 move code into it, they do not introduce a new
  pattern or a base class.
- **No move of `scripts/demoWorkshop`'s dependency on `e2e/support`.** The
  demo driver reusing the e2e helpers is the right direction of reuse; this
  proposal only makes that edge type-checked. Whether a dependency-cruiser rule
  should also fence it is a later question.
- **No dependency-cruiser rules for the root tree.** Layering inside `e2e/` is
  one folder deep (`support/` ← specs); a rule with nothing to forbid is
  ceremony.
- Secondary findings noted for a future run, deliberately untouched here:
  `frontend/src/domain/i18n/messageKey.ts` is the highest-churn source file in
  the repository (34 commits in 180 days, above `backend/Domain/Session.cs` at
  24) because every screen in every role appends to one enum — append-mostly
  and exhaustively type-checked by `Readonly<Record<MessageKey, Message>>`, so
  it is watched, not acted on.
