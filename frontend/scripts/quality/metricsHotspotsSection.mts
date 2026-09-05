import {
  hotspotColumns,
  renderHotspotsTable,
} from "./hotspots/hotspotsTable.mts";
import { formatCount, section } from "./markdownTable.mts";
import type { QualityReport } from "./qualityReport.mts";

const method =
  "A hotspot is a production code file that changes often and is intricate at the same time — where the next bug is most likely to be. Churn counts the commits that touched the file under its present path, over the whole history and without following renames, so a file that was moved starts over. Complexity is cyclomatic, measured by the same tools that enforce the cap — eslint's `complexity` rule per function on the frontend, the VW1001/VW1003 analyzer per method, constructor and property on the backend — and summed over the file's functions; a file without a measured function scores zero. The score is the product of the two.";

export function hotspotsSection(report: QualityReport): string {
  const hotspots = report.hotspots;
  return section("Hotspots", hotspots.commands, [
    method,
    renderHotspotsTable(hotspots.hotspots, Object.values(hotspotColumns)),
    `${formatCount(hotspots.filesAnalysed)} production code files were ranked over ${formatCount(hotspots.commitsInHistory)} commits.`,
  ]);
}
