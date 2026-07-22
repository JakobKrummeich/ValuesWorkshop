# Spec: Task 6 — CI/CD Pipeline + Branch Protection + no-mistakes Wiring

## Objective

GitHub Actions workflow on PRs to `main` that runs every deterministic quality
gate. Branch protection on `main` requires green status. `no-mistakes` config
(`.nm.toml`) wires `commands.test` / `commands.lint` to the same scripts CI
uses — single source of truth via `scripts/`.

## Gate Inventory (from Tasks 1–5)

Every gate already works locally. CI must invoke the same commands:

| Gate | Command | Notes |
|------|---------|-------|
| FE build | `pnpm --dir frontend build` | |
| FE lint | `pnpm --dir frontend lint` | eslint (complexity + dependency-cruiser arch) + stylelint + prettier --check + typecheck + pnpm audit (vuln) |
| FE test + coverage | `pnpm --dir frontend test` | jest --coverage, 80% line threshold |
| BE build | `dotnet build backend/ValuesWorkshop.sln` | VW1001/VW1002 analyzers fire here |
| BE test + coverage | `scripts/test-backend-with-coverage.sh` | coverlet.collector + reportgenerator, 80% line threshold; includes ArchUnitNET arch tests |
| BE format check | `dotnet csharpier check backend/` | |
| BE vulnerabilities | `scripts/check-backend-vulnerabilities.sh` | dotnet list package --vulnerable |
| Duplication (both) | `pnpm -w jscpd` | Cross-cutting — checks FE+BE in one run |

## Workflow Design

### Single workflow file: `.github/workflows/ci.yml`

Trigger: `pull_request` targeting `main` (+ `push` to `main` for post-merge
validation).

### Single job

One sequential job runs all gates. Rationale: splitting into parallel FE/BE
jobs is premature optimization, and cross-cutting gates (jscpd) don't
belong in either side — a green "backend" job that hasn't run duplication
checks is misleading. One job keeps things simple and honest: green = all
gates passed, red = something failed.

```
┌─────────────────────────────────┐
│           ci  job               │
│                                 │
│ • checkout + setup (node, .NET) │
│ • pnpm install                  │
│ • dotnet restore + tool restore │
│ • FE lint                       │
│ • FE build                      │
│ • FE test + coverage            │
│ • BE build (analyzers)          │
│ • BE csharpier check            │
│ • BE test + coverage            │
│ • BE vulnerability check        │
│ • jscpd (both sides)            │
└─────────────────────────────────┘
```

### Runner & toolchain

- `ubuntu-latest`
- Node setup: `actions/setup-node@v4` + `corepack enable` (pnpm)
- .NET setup: `actions/setup-dotnet@v4` with `net10.0` (preview channel
  matching `Directory.Build.props`)
- CSharpier + reportgenerator: `dotnet tool restore` (from `.config/dotnet-tools.json`)

### Caching

- pnpm store: `actions/cache@v4` keyed on `pnpm-lock.yaml`
- NuGet packages: `actions/cache@v4` keyed on `**/*.csproj`

### pnpm audit caveat

`pnpm audit --audit-level=high` currently has 1 moderate finding (non-blocking).
If it errors on network issues in CI, gate should not be flaky — acceptable
risk since GitHub Actions network is reliable.

## Branch Protection

Configure on `main` via GitHub UI (or API) after workflow merges:

- Require status checks: `ci` job
- Require branches to be up to date before merging
- No direct pushes (applies to admins too, ideally)
- No force pushes

Document setup steps in PR description since branch protection is configured
via GitHub UI, not code.

## no-mistakes Wiring

`.nm.toml` at repo root:

```toml
[commands]
test = "scripts/ci-test.sh"
lint = "scripts/ci-lint.sh"
```

Two wrapper scripts that run the same commands as CI:

**`scripts/ci-test.sh`:**
```bash
#!/usr/bin/env bash
set -euo pipefail
echo "=== FE tests + coverage ==="
pnpm --dir frontend test
echo "=== BE tests + coverage ==="
scripts/test-backend-with-coverage.sh
```

**`scripts/ci-lint.sh`:**
```bash
#!/usr/bin/env bash
set -euo pipefail
echo "=== FE lint ==="
pnpm --dir frontend lint
echo "=== FE build ==="
pnpm --dir frontend build
echo "=== BE build (analyzers) ==="
dotnet build backend/ValuesWorkshop.sln
echo "=== BE format check ==="
dotnet csharpier check backend/
echo "=== BE vulnerabilities ==="
scripts/check-backend-vulnerabilities.sh
echo "=== Duplication (both) ==="
pnpm -w jscpd
```

Echo headers before each command so failures produce clear error messages
identifying which gate failed.

Consumers:
- **CI workflow**: calls these same commands as individual steps (for
  per-step GitHub Actions annotations) but identical commands
- **no-mistakes**: `commands.test` / `commands.lint` point to wrapper scripts
- **Developers / agents**: run `./scripts/ci-lint.sh` and `./scripts/ci-test.sh`

## AGENTS.md Update

Add section documenting wrapper scripts so agents know how to run gates:

```markdown
## Quality Gate Scripts

Run all quality gates locally using the same commands CI uses:

- `./scripts/ci-lint.sh` — all lint gates (FE lint, FE build, BE build/analyzers,
  CSharpier, vulnerability scan, jscpd duplication)
- `./scripts/ci-test.sh` — all test gates (FE jest + coverage, BE dotnet
  test + coverage)
- `./scripts/test-backend-with-coverage.sh` — BE test + coverage gate standalone
- `./scripts/check-backend-vulnerabilities.sh` — BE vulnerability scan standalone
```

## Files

| File | Action |
|------|--------|
| `.github/workflows/ci.yml` | New — CI workflow |
| `scripts/ci-test.sh` | New — unified test gate |
| `scripts/ci-lint.sh` | New — unified lint gate |
| `.nm.toml` | New — no-mistakes config |
| `AGENTS.md` | Update — document gate scripts |

| `scripts/check-backend-coverage.sh` | Rename → `scripts/test-backend-with-coverage.sh` |

Existing scripts (`check-backend-vulnerabilities.sh`, `pre-commit`) unchanged.

## Acceptance Criteria

- [ ] PR with failing gate shows red check and cannot merge
- [ ] PR with all gates green shows green check and can merge
- [ ] Direct push to `main` rejected (branch protection)
- [ ] `no-mistakes axi run` invokes same test/lint commands as CI
- [ ] CI and no-mistakes invoke identical scripts (single source of truth)
- [ ] Caching for pnpm store and NuGet packages
- [ ] Each CI step failure produces clear error identifying which gate failed

## Implementation Plan

### 6.1 Create wrapper scripts (XS)
- `scripts/ci-test.sh` and `scripts/ci-lint.sh` with echo headers
- Verify: run both locally, green

### 6.2 Create `.nm.toml` (XS)
- Wire `commands.test` and `commands.lint` to wrapper scripts
- Verify: `no-mistakes axi` sees config

### 6.3 Create CI workflow (S)
- `.github/workflows/ci.yml` — single job, all gates, caching
- Verify: push branch, observe Actions run

### 6.4 Update AGENTS.md (XS)
- Add quality gate scripts section
- Verify: section present

### 6.5 Branch protection (XS, manual)
- Configure via GitHub UI after workflow is live
- Document in PR description
- Verify: attempt direct push → rejected

## Open Questions

None.
