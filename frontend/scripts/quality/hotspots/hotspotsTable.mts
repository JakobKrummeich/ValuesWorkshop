import {
  ColumnAlignment,
  formatCount,
  markdownTable,
} from "../markdownTable.mts";
import type { Hotspot } from "./hotspotAnalysis.mts";

export interface HotspotColumn {
  header: string;
  alignment: ColumnAlignment;
  cell: (hotspot: Hotspot) => string;
}

const left = ColumnAlignment.Left;
const right = ColumnAlignment.Right;

export const tabledHotspots = 10;

export const hotspotColumns = {
  file: {
    header: "file",
    alignment: left,
    cell: (hotspot) => `\`${hotspot.path}\``,
  },
  side: { header: "side", alignment: left, cell: (hotspot) => hotspot.side },
  commits: {
    header: "commits",
    alignment: right,
    cell: (hotspot) => formatCount(hotspot.commits),
  },
  linesChanged: {
    header: "lines changed",
    alignment: right,
    cell: (hotspot) => formatCount(hotspot.linesChanged),
  },
  complexity: {
    header: "complexity",
    alignment: right,
    cell: (hotspot) => formatCount(hotspot.complexity),
  },
  mostComplexFunction: {
    header: "most complex function",
    alignment: right,
    cell: (hotspot) => formatCount(hotspot.mostComplexFunction),
  },
  score: {
    header: "score",
    alignment: right,
    cell: (hotspot) => formatCount(hotspot.score),
  },
} satisfies Record<string, HotspotColumn>;

export function renderHotspotsTable(
  hotspots: readonly Hotspot[],
  columns: readonly HotspotColumn[],
): string {
  return markdownTable(
    columns.map((column) => column.header),
    columns.map((column) => column.alignment),
    hotspots
      .slice(0, tabledHotspots)
      .map((hotspot) => columns.map((column) => column.cell(hotspot))),
  );
}
