# Spec: Task 5 — Complexity + Duplication + Formatting Gates

## Objective

Add deterministic quality gates that catch complexity, duplication, and
formatting drift before code reaches `main`. All gates run via existing
`lint` / `test` commands — no separate invocation. Local workflow applies
formatting (write-mode); CI checks only (never rewrites commits).

## Scope clarification: Task 4 vs Task 5

Arch tests (ArchUnitNET, dependency-cruiser, FluentAssertions) belong to
**Task 4** — separate task, not duplicated here. Task 5 covers: complexity,
duplication, formatting, coverage, and dependency vulnerability scanning.

## Gates

### 1. Cyclomatic Complexity

| Side | Tool | Config | Threshold |
|------|------|--------|-----------|
| FE | eslint `complexity` rule | `eslint.config.mjs` | error at 10 |
| BE | VW1001 (custom Roslyn analyzer) | `ValuesWorkshop.Analyzers` | 10 |

BE: custom Roslyn analyzer `ValuesWorkshop.Analyzers` (netstandard2.0,
wired as ProjectReference analyzer in `Directory.Build.props`). VW1001
enforces cyclomatic complexity ≤ 10. CA1502 disabled (.editorconfig).
SonarAnalyzer.CSharp removed (non-free license).

### 1b. File Length

| Side | Tool | Prod max | Test max |
|------|------|----------|----------|
| FE | eslint `max-lines` (`src/**` only, skips blanks/comments) | 300 | 600 (`*.test.*`) |
| BE | VW1002 (custom Roslyn analyzer) | 300 | 600 (`*.Tests` assemblies) |

Rationale: Seemann limits are method-level (≤24 lines, complexity ≤7);
file budget sized for agent context loads. Tests get 2× budget — DAMP
over DRY (self-contained tests beat shared helpers). jscpd already
excludes tests for the same reason. Config files exempt (FE rule scoped
to `src/**`).

### 2. Duplication

| Tool | Scope | Threshold | Min Tokens |
|------|-------|-----------|------------|
| jscpd | `frontend/src` + `backend/` (C# files) | ≤ 2 % | 50 |

Install `jscpd` as a **root-level** devDependency (repo root `package.json`).
`.jscpd.json` at repo root covers both FE and BE in one run. Wired into:

- **Pre-commit hook** — runs jscpd as part of the commit gate (catches both sides)
- **CI** — dedicated jscpd step (not tied to FE-only or BE-only lint)
- Convenience: `pnpm -w jscpd` from root for manual runs

### 3. Formatting

| Side | Tool | Write mode | Check mode |
|------|------|------------|------------|
| FE (TS/CSS/JSON/MD) | Prettier | `pnpm fmt` | `pnpm fmt:check` (in `lint` script) |
| BE (C#) | CSharpier | `dotnet csharpier .` | `dotnet csharpier --check .` (in BE build/lint) |

- `pnpm fmt` applies Prettier. `pnpm lint` includes `prettier --check`.
- `dotnet csharpier --check backend/` runs in lint/CI.
- **Pre-commit hook** (`scripts/pre-commit`) runs both formatters in write
  mode + jscpd check, stages changes. Documented manual setup — CI is the
  real gate.

### 4. Coverage

| Side | Tool | Threshold | Enforcement |
|------|------|-----------|-------------|
| FE | Jest `coverageThreshold` | 80 % lines | `jest.config.ts` global threshold; `pnpm test` runs with `--coverage` |
| BE | coverlet | 80 % lines | See implementation note below |

**BE coverage — implementation care needed.** `coverlet.msbuild` with
`/p:Threshold=80` can be finicky (known issues with multi-project solutions,
threshold enforcement across projects). Implementation plan:

**Implemented:** `coverlet.collector` + `dotnet-reportgenerator-globaltool`
merges all test project reports → `scripts/check-backend-coverage.sh` parses
aggregate line coverage and fails on <80%. `coverlet.msbuild` per-project
threshold didn't work (each project sees all referenced assemblies, skewing
results).

### 5. Dependency Vulnerability Scanning

| Side | Tool | Severity | Enforcement |
|------|------|----------|-------------|
| FE | `pnpm audit` | `--audit-level=high` | In `lint` script; CI fails on high/critical |
| BE | `dotnet list package --vulnerable` | High + Critical | Script parses output; CI fails if found |

Only `high` and `critical` severities fail the gate — low/moderate are
informational. Prevents shipping known-vulnerable dependencies.

## Commands (after this task)

```bash
# FE
pnpm --dir frontend lint      # eslint (complexity) + stylelint + typecheck + prettier --check + audit
pnpm --dir frontend test       # jest --coverage (80% line gate)
pnpm --dir frontend fmt        # prettier --write (local only)

# BE
dotnet build backend/ValuesWorkshop.sln   # CA1502 fires here (EnforceCodeStyleInBuild)
dotnet test backend/ValuesWorkshop.Tests.slnf  # coverlet 80% line gate
dotnet csharpier --check backend/              # formatting check

# Cross-cutting (repo root)
pnpm -w jscpd                  # duplication check (both sides)

# Pre-commit hook runs: prettier --write, csharpier, jscpd, audit
```

## Files touched

- `package.json` (repo root) — add jscpd devDep + script
- `frontend/package.json` — add prettier devDep + fmt/fmt:check/audit scripts
- `frontend/eslint.config.mjs` — add `complexity` rule
- `frontend/jest.config.ts` — add `coverageThreshold`
- `frontend/.prettierrc` — Prettier config (minimal)
- `frontend/.prettierignore` — ignore .next, coverage, etc.
- `.jscpd.json` — repo-root duplication config
- `backend/Directory.Build.props` — add NetAnalyzers, EnforceCodeStyleInBuild
- `backend/.editorconfig` — CA1502 severity
- `backend/*.Tests/*.csproj` (4 files) — add coverlet package
- `scripts/pre-commit` — formatting + jscpd hook script
- Existing `.ts`/`.css`/`.cs` files — reformat to pass Prettier/CSharpier

## Acceptance Criteria

- [ ] Deliberately complex function (cyclomatic > 10) fails FE eslint
- [ ] Deliberately complex method fails BE build (CA1502)
- [ ] Deliberate copy-pasted block fails jscpd gate
- [ ] Deliberately misformatted `.ts` fails `pnpm lint`
- [ ] Deliberately misformatted `.cs` fails `dotnet csharpier --check`
- [ ] Coverage below 80% lines fails FE `pnpm test` and BE `dotnet test`
- [ ] `pnpm audit` fails on injected high-severity vulnerability (or verified with current deps)
- [ ] All gates green on current codebase (no false positives)
- [ ] Thresholds documented; changes are Ask-first

## Implementation Plan (subtasks)

Order: formatting first (reformats existing files), then independent gates,
then pre-commit hook that ties them together. High-risk items (CA1502,
coverlet) early so we fail fast.

### 5.1 Formatting — Prettier + CSharpier (M, do first)
- Install Prettier as FE devDep, CSharpier as dotnet tool
- Add `frontend/.prettierrc`, `frontend/.prettierignore`
- Add `fmt` (write) and `fmt:check` scripts to FE `package.json`
- Wire `prettier --check` into FE `lint` script
- Reformat all existing `.ts`/`.tsx`/`.css`/`.json` files
- Install CSharpier, reformat all `.cs` files
- Verify: `pnpm --dir frontend lint` green; `dotnet csharpier --check backend/` green
- Verify: deliberately misformat one `.ts` → lint fails; one `.cs` → csharpier fails
- Files: `frontend/package.json`, `frontend/.prettierrc`, `frontend/.prettierignore`,
  all existing source files (reformat)

### 5.2 FE complexity — eslint `complexity` rule (XS)
- Add `complexity: ["error", 10]` to `frontend/eslint.config.mjs`
- Verify: `pnpm --dir frontend lint` green
- Verify: add 11-branch function → lint fails; revert
- Files: `frontend/eslint.config.mjs`

### 5.3 BE complexity — CA1502 via NetAnalyzers (S, high-risk spike)
- Add `Microsoft.CodeAnalysis.NetAnalyzers` to `backend/Directory.Build.props`
- Set `EnforceCodeStyleInBuild=true` in `Directory.Build.props`
- Create `backend/.editorconfig` with `dotnet_diagnostic.CA1502.severity = error`
- Verify: `dotnet build backend/ValuesWorkshop.sln` green
- Verify: add 11+ cyclomatic complexity method → build fails; revert
- Files: `backend/Directory.Build.props`, `backend/.editorconfig`

### 5.4 Duplication — jscpd (S)
- Create root `package.json` with jscpd devDep + script
- Create `.jscpd.json` config: threshold 2%, min-tokens 50,
  paths `["frontend/src", "backend"]`, ignore `["**/*.test.*"]`
- Verify: `pnpm -w jscpd` green
- Verify: copy-paste a 50+ token block → jscpd fails; revert
- Files: `package.json` (root, new), `.jscpd.json` (new), `pnpm-lock.yaml` (root)

### 5.5 Coverage gates — Jest + coverlet (S, high-risk spike for BE)
- FE: add `coverageThreshold` to `frontend/jest.config.ts` (80% lines);
  update `test` script to include `--coverage`
- BE: add `coverlet.msbuild` to each of 4 test csproj files;
  verify `/p:CollectCoverage=true /p:Threshold=80 /p:ThresholdType=line
  /p:ThresholdStat=total` works; if not, fallback to collector+reportgenerator
- Verify: both `pnpm --dir frontend test` and `dotnet test` green
  (current code must meet 80% — skeleton has near 100%)
- Verify: comment out enough test code to drop below 80% → fails; revert
- Files: `frontend/jest.config.ts`, `backend/*.Tests/*.csproj` (4 files)

### 5.6 Dependency vulnerability scanning (XS)
- Add `audit` script to FE `package.json`: `pnpm audit --audit-level=high`
- Wire into FE `lint` script
- BE: add `scripts/check-vulnerable-packages.sh` that runs
  `dotnet list package --vulnerable` and fails on High/Critical
- Verify: both pass on current deps
- Files: `frontend/package.json`, `scripts/check-vulnerable-packages.sh` (new)

### 5.7 Pre-commit hook (XS, last)
- Create `scripts/pre-commit`: runs Prettier write, CSharpier write,
  jscpd check, stages formatted files
- Add setup instructions in `scripts/README.md` or top of hook file
- Verify: make hook executable, install, commit with bad format → auto-fixed
- Files: `scripts/pre-commit` (new)

### Checkpoint
- [ ] All 5+1 gates green on current codebase
- [ ] Each gate proven by deliberate violation + revert
- [ ] Pre-commit hook works end-to-end

## Open Questions

None.
