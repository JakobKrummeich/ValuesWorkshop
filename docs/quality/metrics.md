# Measured quality

Every number on this page is read back from a tool run, and the commands that produced a group are printed with it. Nothing here is written by hand: regenerate the page with `pnpm quality:report`.

| the report describes |  |
| --- | --- |
| commit | `6a2f35f` — Record how the two diagram slices landed and tick off the slices that shipped |
| committed | 2026-09-04T17:12:03+00:00 |
| report generated | 2026-09-04T17:12:12.030Z |

## Size

Produced by:

- `git ls-files`

Line counts cover every tracked text file except binary assets and generated ones — lock files, EF Core migrations, the generated phase module and this report. A file counts as test code when it sits in `*.Tests/`, `__tests__/`, `TestSupport` or `e2e/`, or is named `*.test.*` or `*.spec.*`.

| area | files | production lines | test lines | total lines |
| --- | ---: | ---: | ---: | ---: |
| backend | 338 | 8,793 | 18,395 | 27,188 |
| contract | 41 | 2,830 | 0 | 2,830 |
| design | 8 | 3,222 | 0 | 3,222 |
| docs | 1 | 394 | 0 | 394 |
| e2e | 22 | 0 | 3,488 | 3,488 |
| frontend/src | 503 | 15,843 | 16,457 | 32,300 |
| other | 55 | 4,543 | 0 | 4,543 |
| scripts | 104 | 5,474 | 3,157 | 8,631 |
| tasks | 59 | 10,346 | 0 | 10,346 |
| **repository** | **1,131** | **51,445** | **41,497** | **92,942** |

| extension | files |
| --- | ---: |
| `.cs` | 310 |
| `.ts` | 259 |
| `.tsx` | 190 |
| `.css` | 89 |
| `.md` | 70 |
| `.json` | 63 |
| `.mts` | 55 |
| `.html` | 19 |
| without an extension | 19 |
| `.txt` | 17 |
| `.csproj` | 11 |
| `.sh` | 6 |

## Tests and coverage

Produced by:

- `pnpm --dir frontend test --json --outputFile=<tmp>/jest-report.json --coverageReporters=json-summary --coverageDirectory=<tmp>/coverage`
- `scripts/test-backend-with-coverage.sh`
- `npx playwright test --list --config playwright.config.ts`

| suite | tests | line coverage | enforced minimum | branch coverage |
| --- | ---: | ---: | ---: | ---: |
| jest — frontend units, hooks and components | 1,199 | 94.8% | at least 80% | 92.42% |
| xunit — backend domain, application, adapters and host | 905 | 98.7% | at least 80% | 93.7% |
| Playwright — end to end through the browser | 93 | — | — | — |
| **total** | **2,197** |  |  |  |

Coverage is measured over 2,863 of 3,020 frontend lines and 9,792 of 9,916 backend lines. The end-to-end suite is listed, never run, by this report.

| backend test assembly | tests |
| --- | ---: |
| `ValuesWorkshop.Adapters.Tests.dll` | 224 |
| `ValuesWorkshop.Application.Tests.dll` | 275 |
| `ValuesWorkshop.Domain.Tests.dll` | 308 |
| `ValuesWorkshop.Host.Tests.dll` | 98 |

## Complexity

Produced by:

- `npx eslint --format json --rule "{\"complexity\":[\"error\",0]}"`
- `dotnet build backend/ValuesWorkshop.All.sln`

| measure | frontend | backend |
| --- | ---: | ---: |
| enforced cyclomatic complexity cap | at most 7 (eslint `complexity`) | at most 7 (analyzer VW1001) |
| functions measured | 3,383 | — |
| highest complexity found | 7 | — |
| mean complexity | 1.18 | — |
| file-length and other rule findings | 0 | 0 |

The backend cap is enforced by the VW1001 analyzer at build time with warnings as errors, so a passing build is the measurement: every method is inside the cap. The frontend is measured function by function by re-running eslint with the cap lowered to zero, which turns every function into a reported finding.

| cyclomatic complexity | frontend functions |
| ---: | ---: |
| 1 | 2,991 |
| 2 | 254 |
| 3 | 78 |
| 4 | 37 |
| 5 | 13 |
| 6 | 9 |
| 7 | 1 |

| most complex frontend functions | file | complexity |
| --- | --- | ---: |
| Function 'GroupWorkCard' | `frontend/src/app/participant/phases/groupWork/GroupWorkCard.tsx:13` | 7 |
| Function 'runPhaseEnumCodegen' | `frontend/scripts/generatePhasesModule.mts:55` | 6 |
| Function 'foldFolderEdges' | `frontend/scripts/quality/frontendModulesDiagram.mts:61` | 6 |
| Function 'advanceGuardMessageOf' | `frontend/src/app/facilitator/advanceGuard.ts:16` | 6 |
| Function 'FacilitatorFinalVotingScreen' | `frontend/src/app/facilitator/phases/finalVoting/FacilitatorFinalVotingScreen.tsx:14` | 6 |

| side | kind | longest file | lines | enforced cap |
| --- | --- | --- | ---: | --- |
| backend | production | `backend/Domain/Session.cs` | 262 | at most 300 |
| backend | test | `backend/Adapters.Tests/SqliteSessionRepositoryTests.cs` | 590 | at most 600 |
| frontend | production | `frontend/src/domain/workshopStateBlocks.ts` | 290 | at most 300 |
| frontend | test | `frontend/src/domain/__tests__/participantWorkshopState.test.ts` | 448 | at most 600 |

## Duplication

Produced by:

- `pnpm -w jscpd --reporters json --output <tmp>/jscpd`

| measure | value | enforced limit |
| --- | ---: | ---: |
| duplicated lines | 28 of 24,594 |  |
| duplicated line share | 0.11% | at most 2% |
| duplicated tokens | 257 of 193,226 |  |
| duplicated token share | 0.13% |  |
| clones found | 3 |  |
| detection window | 50 tokens |  |
| sources scanned | 605 |  |

| largest clone | tokens | lines |
| --- | ---: | ---: |
| `frontend/src/adapters/WorkshopRecordDocument.tsx` ↔ `frontend/src/adapters/WorkshopRecordDocument.tsx` | 87 | 8 |
| `frontend/src/app/facilitator/AdvancePhaseButton.module.css` ↔ `frontend/src/app/facilitator/OpenSessionForm.module.css` | 86 | 10 |
| `frontend/src/app/presenter/phases/finalPresentation/WinnerReveal.module.css` ↔ `frontend/src/app/presenter/phases/valuePresentation/PresentedValueView.module.css` | 84 | 13 |

## Architecture

Produced by:

- `npx depcruise src --config .dependency-cruiser.cjs --output-type json`
- `npx depcruise src --config .dependency-cruiser.cjs --output-type json --metrics`

| measure | value |
| --- | ---: |
| frontend modules cruised | 516 |
| frontend dependencies cruised | 1,829 |
| dependency-cruiser rules enforced | 14 |
| dependency-cruiser violations | 0 |
| modules on a dependency cycle | 0 |
| ArchUnitNET rules asserted on the backend | 8 |

Instability is dependency-cruiser's own measure: outgoing dependencies over all dependencies, so 0 is a folder everything depends on and 1 is a folder nothing depends on.

| folder | incoming | outgoing | instability |
| --- | ---: | ---: | ---: |
| `src/domain` | 505 | 21 | 0.04 |
| `src/domain/ports` | 56 | 27 | 0.33 |
| `src/adapters` | 43 | 122 | 0.74 |
| `src/shared` | 48 | 3 | 0.06 |
| `src/app` | 1 | 820 | 1.00 |

| ArchUnitNET rule asserted on the backend |
| --- |
| Domain depends on no other ValuesWorkshop layer |
| Application depends only on Domain |
| Adapters Persistence depends only on Application and Domain |
| Adapters Web depends only on Application and Domain |
| No class has more than 12 public methods |
| No cyclic dependencies between assemblies |
| Host is the executable composition root |
| Only the CpSat adapter references OrTools |

## Design system

Produced by:

- `git ls-files`

| measure | value |
| --- | ---: |
| distinct design tokens | 171 |
| co-located CSS modules | 83 |
| contrast assertions over the token layers | 69 |

| token layer | custom properties |
| --- | ---: |
| `frontend/src/app/facilitator/tokens.facilitator.css` | 52 |
| `frontend/src/app/participant/tokens.participant.css` | 52 |
| `frontend/src/app/presenter/tokens.presenter.css` | 52 |
| `frontend/src/app/tokens.css` | 171 |

## Wire contract

Produced by:

- `git ls-files`

| measure | value |
| --- | ---: |
| checked-in wire state fixtures | 38 |
| frontend assertions over the fixtures | 41 |
| backend contract test methods | 2 |

| wire role | checked-in state fixtures |
| --- | ---: |
| facilitator | 12 |
| participant | 14 |
| presenter | 12 |

## Security

Produced by:

- `pnpm --dir frontend audit:check`
- `scripts/check-backend-vulnerabilities.sh`

| scan | findings | exit code | reported |
| --- | ---: | ---: | --- |
| frontend dependencies | 0 | 0 | No known vulnerabilities of high severity or above |
| backend packages | 0 | 0 | No vulnerable packages across 11 scanned projects |

## Process

Produced by:

- `git rev-list --count 6a2f35f48f59a0cd32244ad105427ace20dbc516`
- `git rev-list --count "--grep=^Merge pull request" 6a2f35f48f59a0cd32244ad105427ace20dbc516`
- `git log --max-parents=0 --format=%cI 6a2f35f48f59a0cd32244ad105427ace20dbc516`
- `git shortlog --summary --numbered 6a2f35f48f59a0cd32244ad105427ace20dbc516`

The history is counted at the commit this report describes, not at the branch tip, so regenerating the report does not move its own numbers.

| measure | value |
| --- | ---: |
| commits | 811 |
| merge commits from pull requests | 67 |
| first commit | 2026-07-19T17:25:51+00:00 |
| contributors | 4 |
