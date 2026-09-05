import {
  hotspotColumns,
  renderHotspotsTable,
} from "./hotspots/hotspotsTable.mts";
import { formatCount, section } from "./markdownTable.mts";
import type { QualityReport } from "./qualityReport.mts";

const method =
  "A hotspot is a production code file that changes often and is intricate at the same time — where the next bug is most likely to be. Churn counts the commits that touched the file under its present path, over the whole history and without following renames, so a file that was moved starts over. Complexity is indentation-based, in the manner of Adam Tornhill's whitespace analysis: every non-blank line adds its nesting depth, at two spaces per level for TypeScript and four for C#. The score is the product of the two.";

export function hotspotsSection(report: QualityReport): string {
  const hotspots = report.hotspots;
  return section("Hotspots", hotspots.commands, [
    method,
    renderHotspotsTable(hotspots.hotspots, Object.values(hotspotColumns)),
    `${formatCount(hotspots.filesAnalysed)} production code files were ranked over ${formatCount(hotspots.commitsInHistory)} commits.`,
  ]);
}
