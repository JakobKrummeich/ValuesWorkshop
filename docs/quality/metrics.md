# Measured quality

Every number on this page is read back from a tool run, and the commands that produced a group are printed with it. Nothing here is written by hand: regenerate the page with `pnpm quality:report`.

| the report describes |  |
| --- | --- |
| commit | `385f109` — Say in the Supply chain section and the task 30 notes where the frontend bill's dependency graph comes from, and why pnpm's own is not used |
| committed | 2026-09-05T16:50:14+00:00 |
| report generated | 2026-09-05T16:51:09.030Z |

## Size

Produced by:

- `git ls-files`

Line counts cover every tracked text file except binary assets and generated ones — lock files, EF Core migrations, the generated phase module, this report and the regions of the README that `pnpm quality:report` writes. A file counts as test code when it sits in `*.Tests/`, `__tests__/`, `TestSupport` or `e2e/`, or is named `*.test.*` or `*.spec.*`.

| area | files | production lines | test lines | total lines |
| --- | ---: | ---: | ---: | ---: |
| backend | 354 | 8,926 | 19,897 | 28,823 |
| contract | 41 | 2,830 | 0 | 2,830 |
| design | 8 | 3,245 | 0 | 3,245 |
| docs | 1 | 394 | 0 | 394 |
| e2e | 23 | 0 | 3,650 | 3,650 |
| frontend/src | 510 | 15,874 | 16,955 | 32,829 |
| other | 58 | 4,860 | 0 | 4,860 |
| scripts | 147 | 7,759 | 5,187 | 12,946 |
| tasks | 60 | 10,554 | 0 | 10,554 |
| **repository** | **1,202** | **54,442** | **45,689** | **100,131** |

| extension | files |
| --- | ---: |
| `.cs` | 323 |
| `.ts` | 266 |
| `.tsx` | 190 |
| `.mts` | 93 |
| `.css` | 90 |
| `.md` | 71 |
| `.json` | 66 |
| `.html` | 19 |
| without an extension | 19 |
| `.txt` | 19 |
| `.csproj` | 12 |
| `.sh` | 7 |

## Tests and coverage

Produced by:

- `pnpm --dir frontend test --json --outputFile=<tmp>/jest-report.json --coverageReporters=json-summary --coverageDirectory=<tmp>/coverage`
- `scripts/test-backend-with-coverage.sh`
- `npx playwright test --list --config playwright.config.ts`

| suite | tests | line coverage | enforced minimum | branch coverage |
| --- | ---: | ---: | ---: | ---: |
| jest — frontend units, hooks and components | 1,379 | 92.56% | at least 80% | 90.18% |
| xunit — backend domain, application, adapters and host | 954 | 98.6% | at least 80% | 92.8% |
| Playwright — end to end through the browser | 93 | — | — | — |
| **total** | **2,426** |  |  |  |

Coverage is measured over 3,288 of 3,552 frontend lines and 10,003 of 10,136 backend lines. The end-to-end suite is listed, never run, by this report.

| backend test assembly | tests |
| --- | ---: |
| `ValuesWorkshop.Adapters.Tests.dll` | 224 |
| `ValuesWorkshop.Analyzers.Tests.dll` | 12 |
| `ValuesWorkshop.Application.Tests.dll` | 284 |
| `ValuesWorkshop.Domain.Tests.dll` | 330 |
| `ValuesWorkshop.Host.Tests.dll` | 104 |

## Complexity

Produced by:

- `npx eslint --format json --rule "{\"complexity\":[\"error\",0]}"`
- `dotnet build backend/ValuesWorkshop.All.sln --no-incremental -p:ReportCyclomaticComplexity=true`

| measure | frontend | backend |
| --- | ---: | ---: |
| enforced cyclomatic complexity cap | at most 7 (eslint `complexity`) | at most 7 (analyzer VW1001) |
| functions measured | 3,853 | 1,807 |
| highest complexity found | 7 | 7 |
| mean complexity | 1.19 | 1.26 |
| functions above the cap | 0 | 0 |

Both sides are measured function by function by the tool that enforces the cap. The frontend re-runs eslint with the cap lowered to zero, which turns every function into a reported finding. The backend rebuilds every project with the analyzer's hidden VW1003 diagnostic promoted to a warning, which reports the cyclomatic complexity of every method, constructor and property with code in it; VW1001 fails the build above the cap, so a report exists only for a backend that passes it.

| cyclomatic complexity | frontend functions | backend functions |
| ---: | ---: | ---: |
| 1 | 3,393 | 1,525 |
| 2 | 292 | 172 |
| 3 | 94 | 64 |
| 4 | 48 | 22 |
| 5 | 16 | 14 |
| 6 | 9 | 8 |
| 7 | 1 | 2 |

| most complex frontend functions | file | complexity |
| --- | --- | ---: |
| Function 'GroupWorkCard' | `frontend/src/app/participant/phases/groupWork/GroupWorkCard.tsx:13` | 7 |
| Function 'runPhaseEnumCodegen' | `frontend/scripts/generatePhasesModule.mts:55` | 6 |
| Function 'foldFolderEdges' | `frontend/scripts/quality/frontendModulesDiagram.mts:61` | 6 |
| Function 'advanceGuardMessageOf' | `frontend/src/app/facilitator/advanceGuard.ts:16` | 6 |
| Function 'FacilitatorFinalVotingScreen' | `frontend/src/app/facilitator/phases/finalVoting/FacilitatorFinalVotingScreen.tsx:14` | 6 |

| most complex backend functions | file | complexity |
| --- | --- | ---: |
| CollectIdentifyingPaths | `backend/Application.Tests/WorkshopStateAnonymityTests.cs:122` | 7 |
| InPhase | `backend/TestSupport/TestSessions.cs:21` | 7 |
| ResponseFor | `backend/Adapters.Web/SessionCreationEndpoint.cs:59` | 6 |
| SolveFor | `backend/Application/Formation/GroupFormationRunner.cs:161` | 6 |
| RequiredVotes | `backend/Application/Intents/IntentPayloadValidator.cs:48` | 6 |

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
| duplicated lines | 28 of 24,818 |  |
| duplicated line share | 0.11% | at most 2% |
| duplicated tokens | 257 of 194,739 |  |
| duplicated token share | 0.13% |  |
| clones found | 3 |  |
| detection window | 50 tokens |  |
| sources scanned | 609 |  |

| largest clone | tokens | lines |
| --- | ---: | ---: |
| `frontend/src/adapters/WorkshopRecordDocument.tsx` ↔ `frontend/src/adapters/WorkshopRecordDocument.tsx` | 87 | 8 |
| `frontend/src/app/facilitator/AdvancePhaseButton.module.css` ↔ `frontend/src/app/facilitator/OpenSessionForm.module.css` | 86 | 10 |
| `frontend/src/app/presenter/phases/finalPresentation/WinnerReveal.module.css` ↔ `frontend/src/app/presenter/phases/valuePresentation/PresentedValueView.module.css` | 84 | 13 |

## Hotspots

Produced by:

- `git ls-files`
- `git log --numstat --no-renames --format=%H 385f10953ab57f77374f6938ddefa6b9ab44f39a`

A hotspot is a production code file that changes often and is intricate at the same time — where the next bug is most likely to be. Churn counts the commits that touched the file under its present path, over the whole history and without following renames, so a file that was moved starts over. Complexity is cyclomatic, measured by the same tools that enforce the cap — eslint's `complexity` rule per function on the frontend, the VW1001/VW1003 analyzer per method, constructor and property on the backend — and summed over the file's functions; a file without a measured function scores zero. The score is the product of the two.

| file | side | commits | lines changed | complexity | most complex function | score |
| --- | --- | ---: | ---: | ---: | ---: | ---: |
| `backend/Domain/Session.cs` | backend | 24 | 486 | 32 | 4 | 768 |
| `backend/Domain/VotingRounds.cs` | backend | 8 | 264 | 48 | 6 | 384 |
| `backend/Domain/Group.cs` | backend | 11 | 257 | 30 | 4 | 330 |
| `frontend/src/app/participant/phases/groupWork/useGroupWorkCard.ts` | frontend | 12 | 471 | 27 | 6 | 324 |
| `backend/Domain/QuizProgress.cs` | backend | 11 | 199 | 25 | 6 | 275 |
| `backend/Adapters.Persistence/SqliteSessionRepository.cs` | backend | 11 | 348 | 23 | 5 | 253 |
| `backend/Adapters.Web/ParticipantHub.cs` | backend | 18 | 235 | 12 | 3 | 216 |
| `backend/Application/Formation/GroupFormationRunner.cs` | backend | 8 | 304 | 26 | 6 | 208 |
| `backend/Application/Intents/FacilitatorIntentHandler.cs` | backend | 16 | 271 | 13 | 2 | 208 |
| `frontend/src/adapters/authAdapter.ts` | frontend | 9 | 272 | 22 | 3 | 198 |

425 production code files were ranked over 875 commits.

## Architecture

Produced by:

- `npx depcruise src --config .dependency-cruiser.cjs --output-type json`
- `npx depcruise src --config .dependency-cruiser.cjs --output-type json --metrics`

| measure | value |
| --- | ---: |
| frontend modules cruised | 524 |
| frontend dependencies cruised | 1,844 |
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

## Mutation testing

Produced by:

- `pnpm mutation:frontend`
- `pnpm mutation:backend`

Mutation testing changes the production code and asks whether a test notices. It is far too slow for a pull request, so it runs nightly and on demand, and the scores below are read back from the last recorded run.

| side | tool | mutation score | killed | survived | timed out | not covered | measured at |
| --- | --- | ---: | ---: | ---: | ---: | ---: | --- |
| frontend | StrykerJS 10.0.0 | 86.43% | 2,136 | 296 | 4 | 40 | `800a926` on 2026-09-05 |
| backend | Stryker.NET 4.16.0 | 84.59% | 1,223 | 198 | 1 | 25 | `ce36bb8` on 2026-09-04 |

The frontend and backend scores were measured at `800a926` and `ce36bb8`, not at `385f109` — the commit this report describes — so they describe the code as it stood then.

## Security

Produced by:

- `pnpm --dir frontend audit:check`
- `scripts/check-backend-vulnerabilities.sh`

| scan | findings | exit code | reported |
| --- | ---: | ---: | --- |
| frontend dependencies | 0 | 0 | No known vulnerabilities of high severity or above |
| backend packages | 0 | 0 | No vulnerable packages across 12 scanned projects |

## Supply chain

Produced by:

- `pnpm run sbom`
- `pnpm run advisories:scan`

| bill of materials | describes | components |
| --- | --- | ---: |
| `docs/quality/sbom/frontend.cdx.json` | frontend runtime dependencies of the pnpm workspace | 179 |
| `docs/quality/sbom/backend.cdx.json` | backend runtime packages of the .NET solution | 67 |

The bills of materials are CycloneDX documents emitted by the generators and then stripped of the serial number, the run timestamp and the annotation that restates it, so regenerating them against an unchanged dependency set leaves no diff. The frontend bill keeps pnpm's component list but takes its dependency graph from `pnpm-lock.yaml`, because `pnpm sbom` leaves about a third of the production dependency edges out; the packages the lockfile reaches are cross-checked against the components pnpm listed.

| scan | findings | exit code | reported |
| --- | ---: | ---: | --- |
| osv-scanner over `pnpm-lock.yaml` and both bills of materials | 0 | 0 | No known advisories in the scanned lockfile and bills of materials |

## Process

Produced by:

- `git rev-list --count 385f10953ab57f77374f6938ddefa6b9ab44f39a`
- `git rev-list --count "--grep=^Merge pull request" 385f10953ab57f77374f6938ddefa6b9ab44f39a`
- `git log --max-parents=0 --format=%cI 385f10953ab57f77374f6938ddefa6b9ab44f39a`
- `git shortlog --summary --numbered 385f10953ab57f77374f6938ddefa6b9ab44f39a`

The history is counted at the commit this report describes, not at the branch tip, so regenerating the report does not move its own numbers.

| measure | value |
| --- | ---: |
| commits | 875 |
| merge commits from pull requests | 72 |
| first commit | 2026-07-19T17:25:51+00:00 |
| contributors | 4 |
