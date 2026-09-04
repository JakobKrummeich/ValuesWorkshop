# Measured quality

Every number on this page is read back from a tool run, and the commands that produced a group are printed with it. Nothing here is written by hand: regenerate the page with `pnpm quality:report`.

| the report describes |  |
| --- | --- |
| commit | `bad7697` — Record how the property and accessibility slices landed and tick them off |
| committed | 2026-09-04T18:10:30+00:00 |
| report generated | 2026-09-04T18:10:33.844Z |

## Size

Produced by:

- `git ls-files`

Line counts cover every tracked text file except binary assets and generated ones — lock files, EF Core migrations, the generated phase module and this report. A file counts as test code when it sits in `*.Tests/`, `__tests__/`, `TestSupport` or `e2e/`, or is named `*.test.*` or `*.spec.*`.

| area | files | production lines | test lines | total lines |
| --- | ---: | ---: | ---: | ---: |
| backend | 347 | 8,793 | 19,429 | 28,222 |
| contract | 41 | 2,830 | 0 | 2,830 |
| design | 8 | 3,222 | 0 | 3,222 |
| docs | 1 | 394 | 0 | 394 |
| e2e | 23 | 0 | 3,593 | 3,593 |
| frontend/src | 509 | 15,874 | 16,898 | 32,772 |
| other | 55 | 4,545 | 0 | 4,545 |
| scripts | 104 | 5,474 | 3,157 | 8,631 |
| tasks | 59 | 10,365 | 0 | 10,365 |
| **repository** | **1,147** | **51,497** | **43,077** | **94,574** |

| extension | files |
| --- | ---: |
| `.cs` | 319 |
| `.ts` | 265 |
| `.tsx` | 190 |
| `.css` | 90 |
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
| jest — frontend units, hooks and components | 1,236 | 94.8% | at least 80% | 92.41% |
| xunit — backend domain, application, adapters and host | 930 | 98.6% | at least 80% | 93.2% |
| Playwright — end to end through the browser | 93 | — | — | — |
| **total** | **2,259** |  |  |  |

Coverage is measured over 2,865 of 3,022 frontend lines and 9,866 of 9,996 backend lines. The end-to-end suite is listed, never run, by this report.

| backend test assembly | tests |
| --- | ---: |
| `ValuesWorkshop.Adapters.Tests.dll` | 224 |
| `ValuesWorkshop.Application.Tests.dll` | 277 |
| `ValuesWorkshop.Domain.Tests.dll` | 327 |
| `ValuesWorkshop.Host.Tests.dll` | 102 |

## Complexity

Produced by:

- `npx eslint --format json --rule "{\"complexity\":[\"error\",0]}"`
- `dotnet build backend/ValuesWorkshop.All.sln`

| measure | frontend | backend |
| --- | ---: | ---: |
| enforced cyclomatic complexity cap | at most 7 (eslint `complexity`) | at most 7 (analyzer VW1001) |
| functions measured | 3,467 | — |
| highest complexity found | 7 | — |
| mean complexity | 1.18 | — |
| file-length and other rule findings | 0 | 0 |

The backend cap is enforced by the VW1001 analyzer at build time with warnings as errors, so a passing build is the measurement: every method is inside the cap. The frontend is measured function by function by re-running eslint with the cap lowered to zero, which turns every function into a reported finding.

| cyclomatic complexity | frontend functions |
| ---: | ---: |
| 1 | 3,067 |
| 2 | 258 |
| 3 | 80 |
| 4 | 39 |
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
| duplicated lines | 28 of 24,732 |  |
| duplicated line share | 0.11% | at most 2% |
| duplicated tokens | 257 of 194,228 |  |
| duplicated token share | 0.13% |  |
| clones found | 3 |  |
| detection window | 50 tokens |  |
| sources scanned | 608 |  |

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
| frontend modules cruised | 523 |
| frontend dependencies cruised | 1,841 |
| dependency-cruiser rules enforced | 14 |
| dependency-cruiser violations | 0 |
| modules on a dependency cycle | 0 |
| ArchUnitNET rules asserted on the backend | 8 |

Instability is dependency-cruiser's own measure: outgoing dependencies over all dependencies, so 0 is a folder everything depends on and 1 is a folder nothing depends on.

| folder | incoming | outgoing | instability |
| --- | ---: | ---: | ---: |
| `src/domain` | 505 | 25 | 0.05 |
| `src/domain/ports` | 56 | 27 | 0.33 |
| `src/adapters` | 43 | 122 | 0.74 |
| `src/shared` | 48 | 3 | 0.06 |
| `src/app` | 1 | 821 | 1.00 |

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
| distinct design tokens | 173 |
| co-located CSS modules | 84 |
| contrast assertions over the token layers | 84 |

| token layer | custom properties |
| --- | ---: |
| `frontend/src/app/facilitator/tokens.facilitator.css` | 53 |
| `frontend/src/app/participant/tokens.participant.css` | 53 |
| `frontend/src/app/presenter/tokens.presenter.css` | 53 |
| `frontend/src/app/tokens.css` | 173 |

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

- `git rev-list --count bad7697c3bcf85c0238736c1ff1fb7eaa0f9a22f`
- `git rev-list --count "--grep=^Merge pull request" bad7697c3bcf85c0238736c1ff1fb7eaa0f9a22f`
- `git log --max-parents=0 --format=%cI bad7697c3bcf85c0238736c1ff1fb7eaa0f9a22f`
- `git shortlog --summary --numbered bad7697c3bcf85c0238736c1ff1fb7eaa0f9a22f`

The history is counted at the commit this report describes, not at the branch tip, so regenerating the report does not move its own numbers.

| measure | value |
| --- | ---: |
| commits | 816 |
| merge commits from pull requests | 67 |
| first commit | 2026-07-19T17:25:51+00:00 |
| contributors | 4 |
