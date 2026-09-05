import { basename } from "node:path";
import { replaceMarkedRegion } from "./markedRegion.mts";
import type { QualityReport } from "./qualityReport.mts";
import { renderHeadlineTable } from "./readmeHeadlineTable.mts";
import type { GeneratedDiagram } from "./structuralDiagrams.mts";

export const readmePath = "README.md";
export const headlineRegion = "headline";

export function diagramRegionOf(diagramPath: string): string {
  return `diagram:${basename(diagramPath, ".mmd")}`;
}

export function mermaidFence(mermaid: string): string {
  return ["```mermaid", mermaid.trimEnd(), "```"].join("\n");
}

export function renderReadme(
  readme: string,
  report: QualityReport,
  diagrams: readonly GeneratedDiagram[],
): string {
  return diagrams.reduce(
    (document, diagram) =>
      replaceMarkedRegion(
        document,
        diagramRegionOf(diagram.path),
        mermaidFence(diagram.mermaid),
      ),
    replaceMarkedRegion(readme, headlineRegion, renderHeadlineTable(report)),
  );
}
