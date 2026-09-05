import {
  ColumnAlignment,
  formatCount,
  markdownTable,
  section,
} from "./markdownTable.mts";
import type { QualityReport } from "./qualityReport.mts";

const left = ColumnAlignment.Left;
const right = ColumnAlignment.Right;
const tabledHotspots = 10;

const method =
  "A hotspot is a production code file that changes often and is intricate at the same time — where the next bug is most likely to be. Churn counts the commits that touched the file under its present path, over the whole history and without following renames, so a file that was moved starts over. Complexity is indentation-based, in the manner of Adam Tornhill's whitespace analysis: every non-blank line adds its nesting depth, at two spaces per level for TypeScript and four for C#. The score is the product of the two.";

export function hotspotsSection(report: QualityReport): string {
  const hotspots = report.hotspots;
  return section("Hotspots", hotspots.commands, [
    method,
    markdownTable(
      [
        "file",
        "side",
        "commits",
        "lines changed",
        "complexity",
        "deepest nesting",
        "score",
      ],
      [left, left, right, right, right, right, right],
      hotspots.hotspots
        .slice(0, tabledHotspots)
        .map((hotspot) => [
          `\`${hotspot.path}\``,
          hotspot.side,
          formatCount(hotspot.commits),
          formatCount(hotspot.linesChanged),
          formatCount(hotspot.complexity),
          formatCount(hotspot.maximumDepth),
          formatCount(hotspot.score),
        ]),
    ),
    `${formatCount(hotspots.filesAnalysed)} production code files were ranked over ${formatCount(hotspots.commitsInHistory)} commits; the twelve highest scores are drawn in [hotspots.mmd](hotspots.mmd), scaled to the busiest and the most complex file.`,
  ]);
}
