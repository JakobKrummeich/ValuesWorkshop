import { basename } from "node:path";
import {
  hotspotColumns,
  renderHotspotsTable,
} from "./hotspots/hotspotsTable.mts";
import { replaceMarkedRegion } from "./markedRegion.mts";
import type { QualityReport } from "./qualityReport.mts";
import { renderHeadlineTable } from "./readmeHeadlineTable.mts";
import type { GeneratedDiagram } from "./structuralDiagrams.mts";

export const readmePath = "README.md";
export const headlineRegion = "headline";
export const hotspotsRegion = "hotspots";

const readmeHotspotColumns = [
  hotspotColumns.file,
  hotspotColumns.side,
  hotspotColumns.commits,
  hotspotColumns.linesChanged,
  hotspotColumns.complexity,
  hotspotColumns.score,
];

export function diagramRegionOf(diagramPath: string): string {
  return `diagram:${basename(diagramPath, ".mmd")}`;
}

export function mermaidFence(mermaid: string): string {
  return ["```mermaid", mermaid.trimEnd(), "```"].join("\n");
}

function withTables(readme: string, report: QualityReport): string {
  const withHeadline = replaceMarkedRegion(
    readme,
    headlineRegion,
    renderHeadlineTable(report),
  );
  return replaceMarkedRegion(
    withHeadline,
    hotspotsRegion,
    renderHotspotsTable(report.hotspots.hotspots, readmeHotspotColumns),
  );
}

export function renderReadmeDiagrams(
  readme: string,
  diagrams: readonly GeneratedDiagram[],
): string {
  return diagrams.reduce(
    (document, diagram) =>
      replaceMarkedRegion(
        document,
        diagramRegionOf(diagram.path),
        mermaidFence(diagram.mermaid),
      ),
    readme,
  );
}

export function renderReadme(
  readme: string,
  report: QualityReport,
  diagrams: readonly GeneratedDiagram[],
): string {
  return renderReadmeDiagrams(withTables(readme, report), diagrams);
}
