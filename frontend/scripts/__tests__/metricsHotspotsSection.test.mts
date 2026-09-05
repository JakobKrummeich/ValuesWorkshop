import { hotspotsSection } from "../quality/metricsHotspotsSection.mts";
import type { Hotspot } from "../quality/hotspots/hotspotAnalysis.mts";
import { RepositorySide } from "../quality/sizeScan.mts";
import { sampleQualityReport } from "../testing/sampleQualityReport.mts";

describe("hotspotsSection", () => {
  const section = hotspotsSection(sampleQualityReport);

  it("opens with the commands that produced it", () => {
    expect(section.split("\n").slice(0, 7)).toEqual([
      "## Hotspots",
      "",
      "Produced by:",
      "",
      "- `git ls-files`",
      "- `git log --numstat --no-renames --format=%H fd3cb1bee884e8679c0de08042e0da7c724593c0`",
      "",
    ]);
  });

  it("says how churn and complexity were counted, limits included", () => {
    expect(section).toContain(
      "A hotspot is a production code file that changes often and is intricate at the same time — where the next bug is most likely to be. Churn counts the commits that touched the file under its present path, over the whole history and without following renames, so a file that was moved starts over. Complexity is indentation-based, in the manner of Adam Tornhill's whitespace analysis: every non-blank line adds its nesting depth, at two spaces per level for TypeScript and four for C#. The score is the product of the two.",
    );
  });

  it("tables the top ten with everything that went into their score", () => {
    expect(section).toContain(
      "| file | side | commits | lines changed | complexity | deepest nesting | score |",
    );
    expect(section).toContain(
      "| `backend/Domain/Session.cs` | backend | 61 | 1,480 | 412 | 5 | 25,132 |",
    );
    expect(section).toContain(
      "| `frontend/src/app/participant/page.tsx` | frontend | 30 | 512 | 190 | 6 | 5,700 |",
    );
  });

  it("stops the table at ten", () => {
    const many: Hotspot[] = Array.from({ length: 15 }, (_, index) => ({
      path: `backend/Domain/File${index}.cs`,
      side: RepositorySide.Backend,
      commits: 15 - index,
      linesChanged: 100,
      complexity: 10,
      maximumDepth: 2,
      score: (15 - index) * 10,
    }));
    const long = hotspotsSection({
      ...sampleQualityReport,
      hotspots: { ...sampleQualityReport.hotspots, hotspots: many },
    });
    expect(long).toContain("| `backend/Domain/File9.cs` |");
    expect(long).not.toContain("| `backend/Domain/File10.cs` |");
  });

  it("says how much was analysed and where the picture is", () => {
    expect(section).toContain(
      "512 production code files were ranked over 800 commits; the twelve highest scores are drawn in [hotspots.mmd](hotspots.mmd), scaled to the busiest and the most complex file.",
    );
  });
});
