import { indented, mermaidDocument } from "../mermaidDocument.mts";
import type {
  Hotspot,
  HotspotMaxima,
  HotspotMetrics,
} from "./hotspotAnalysis.mts";

export const hotspotsDiagramPath = "docs/quality/hotspots.mmd";
export const plottedHotspots = 12;

const diagramTitle = "Hotspots — where change and complexity meet";

const axes = [
  "x-axis Rarely changed --> Changed often",
  "y-axis Simple --> Complex",
  "quadrant-1 Hotspots — refactor first",
  "quadrant-2 Complex, quiet",
  "quadrant-3 Quiet, simple",
  "quadrant-4 Volatile, simple",
];

const chartSize = { quadrantChart: { chartWidth: 800, chartHeight: 560 } };
const plotFloor = 0.1;
const plotCeiling = 0.9;

function plotCoordinate(value: number, maximum: number): number {
  const share = maximum === 0 ? 0 : value / maximum;
  return (
    Math.round((plotFloor + (plotCeiling - plotFloor) * share) * 100) / 100
  );
}

function suffixOf(path: string, segments: number): string {
  return path.split("/").slice(-segments).join("/");
}

function shortestUniqueSuffix(path: string, paths: readonly string[]): string {
  const depth = path.split("/").length;
  for (let segments = 1; segments <= depth; segments += 1) {
    const suffix = suffixOf(path, segments);
    const sharing = paths.filter(
      (other) => suffixOf(other, segments) === suffix,
    );
    if (sharing.length === 1) {
      return suffix;
    }
  }
  return path;
}

function point(hotspot: Hotspot, label: string, maxima: HotspotMaxima): string {
  const x = plotCoordinate(hotspot.commits, maxima.commits);
  const y = plotCoordinate(hotspot.complexity, maxima.complexity);
  return `"${label}": [${x}, ${y}]`;
}

export function renderHotspotsDiagram(metrics: HotspotMetrics): string {
  const plotted = metrics.hotspots.slice(0, plottedHotspots);
  const paths = plotted.map((hotspot) => hotspot.path);
  return mermaidDocument(
    diagramTitle,
    [
      "quadrantChart",
      ...indented([
        ...axes,
        ...plotted.map((hotspot) =>
          point(
            hotspot,
            shortestUniqueSuffix(hotspot.path, paths),
            metrics.maxima,
          ),
        ),
      ]),
    ],
    chartSize,
  );
}
