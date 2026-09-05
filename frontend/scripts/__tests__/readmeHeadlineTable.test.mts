import { renderHeadlineTable } from "../quality/readmeHeadlineTable.mts";
import { sampleQualityReport } from "../testing/sampleQualityReport.mts";

describe("renderHeadlineTable", () => {
  const rows = renderHeadlineTable(sampleQualityReport).split("\n");

  it("puts every headline number next to the tool that enforces it", () => {
    expect(rows).toEqual([
      "| What | Frontend | Backend | Enforced by |",
      "| --- | ---: | ---: | --- |",
      "| Production code | 15,874 lines | 12,000 lines | — |",
      "| Test code | 16,898 lines | 14,000 lines | — |",
      "| Tests | 1,063 jest | 901 xunit | `scripts/ci-test.sh` on every push, plus 93 Playwright journeys through a real browser |",
      "| Line coverage | 97.53% (at least 80%) | 98.7% (at least 80%) | `jest --coverage` / coverlet |",
      "| Mutation score | 81.25% | 75.41% | Stryker, nightly and on demand |",
      "| Cyclomatic complexity | highest 7 (at most 7) | highest 6 (at most 7) | eslint `complexity` / analyzer VW1001 |",
      "| Longest production file | 290 lines (at most 300) | 289 lines (at most 300) | eslint `max-lines` / analyzer VW1002 |",
      "| Duplicated tokens | 0.13% (at most 2%) | 0.13% (at most 2%) | `jscpd`, one scan over both sides |",
      "| Architecture violations | 0 across 14 dependency-cruiser rules | 0 across 8 ArchUnitNET rules | dependency-cruiser fails the lint, ArchUnitNET fails the tests |",
      "| Known advisories | 0 | 0 | `pnpm audit` / `dotnet list package --vulnerable`; osv-scanner over the lockfile and both SBOMs finds 0 |",
    ]);
  });

  it("says plainly when a side has no mutation score yet", () => {
    const table = renderHeadlineTable({
      ...sampleQualityReport,
      mutation: { backend: sampleQualityReport.mutation.backend },
    });
    expect(table).toContain(
      "| Mutation score | not yet measured | 75.41% | Stryker, nightly and on demand |",
    );
  });

  it("refuses a report that measured only one side", () => {
    const halved = {
      ...sampleQualityReport,
      size: {
        ...sampleQualityReport.size,
        areas: sampleQualityReport.size.areas.slice(0, 1),
      },
    };
    expect(() => renderHeadlineTable(halved)).toThrow(
      "The report has no size for the area frontend/src.",
    );
    const noLongest = {
      ...sampleQualityReport,
      complexity: { ...sampleQualityReport.complexity, longestFiles: [] },
    };
    expect(() => renderHeadlineTable(noLongest)).toThrow(
      "The report names no longest production file for the frontend.",
    );
  });
});
