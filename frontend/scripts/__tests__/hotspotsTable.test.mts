import type { Hotspot } from "../quality/hotspots/hotspotAnalysis.mts";
import {
  hotspotColumns,
  renderHotspotsTable,
  tabledHotspots,
} from "../quality/hotspots/hotspotsTable.mts";
import { RepositorySide } from "../quality/sizeScan.mts";
import { sampleQualityReport } from "../testing/sampleQualityReport.mts";

const everyColumn = Object.values(hotspotColumns);

describe("renderHotspotsTable", () => {
  it("tables the requested columns in the requested order, thousands grouped", () => {
    expect(
      renderHotspotsTable(sampleQualityReport.hotspots.hotspots, everyColumn),
    ).toBe(
      [
        "| file | side | commits | lines changed | complexity | most complex function | score |",
        "| --- | --- | ---: | ---: | ---: | ---: | ---: |",
        "| `backend/Domain/Session.cs` | backend | 61 | 1,480 | 412 | 6 | 25,132 |",
        "| `frontend/src/app/facilitator/page.tsx` | frontend | 34 | 620 | 210 | 7 | 7,140 |",
        "| `frontend/src/app/participant/page.tsx` | frontend | 30 | 512 | 190 | 5 | 5,700 |",
      ].join("\n"),
    );
  });

  it("leaves out the columns a page does not ask for", () => {
    const table = renderHotspotsTable(sampleQualityReport.hotspots.hotspots, [
      hotspotColumns.file,
      hotspotColumns.score,
    ]);
    expect(table.split("\n").slice(0, 3)).toEqual([
      "| file | score |",
      "| --- | ---: |",
      "| `backend/Domain/Session.cs` | 25,132 |",
    ]);
  });

  it("stops at ten rows", () => {
    const many: Hotspot[] = Array.from({ length: 15 }, (_, index) => ({
      path: `backend/Domain/File${index}.cs`,
      side: RepositorySide.Backend,
      commits: 15 - index,
      linesChanged: 100,
      complexity: 10,
      mostComplexFunction: 2,
      score: (15 - index) * 10,
    }));
    const table = renderHotspotsTable(many, everyColumn);
    expect(tabledHotspots).toBe(10);
    expect(table.split("\n")).toHaveLength(12);
    expect(table).toContain("| `backend/Domain/File9.cs` |");
    expect(table).not.toContain("| `backend/Domain/File10.cs` |");
  });
});
