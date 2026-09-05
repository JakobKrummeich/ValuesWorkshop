import {
  recorded,
  runInRepository,
  type CollectionContext,
  type TrackedFileListing,
} from "../collectionContext.mts";
import type { ComplexFunction } from "../complexityScan.mts";
import type { CommitStamp, MetricGroup } from "../qualityReport.mts";
import {
  areaOf,
  extensionOf,
  isMeasuredPath,
  RepositoryArea,
  RepositorySide,
  SourceKind,
  sourceKindOf,
} from "../sizeScan.mts";
import {
  churnLogArguments,
  parseChurnLog,
  type ChurnHistory,
} from "./gitChurn.mts";

export interface FileComplexity {
  total: number;
  maximum: number;
  functions: number;
}

export interface Hotspot {
  path: string;
  side: RepositorySide;
  commits: number;
  linesChanged: number;
  complexity: number;
  mostComplexFunction: number;
  score: number;
}

export interface HotspotMetrics {
  filesAnalysed: number;
  commitsInHistory: number;
  hotspots: Hotspot[];
}

export const reportedHotspots = 15;

const sideByArea: Partial<Record<RepositoryArea, RepositorySide>> = {
  [RepositoryArea.Backend]: RepositorySide.Backend,
  [RepositoryArea.FrontendSource]: RepositorySide.Frontend,
};

const analysedExtensions: ReadonlySet<string> = new Set(["cs", "ts", "tsx"]);

const unmeasured: FileComplexity = { total: 0, maximum: 0, functions: 0 };

export function isHotspotCandidate(path: string): boolean {
  return (
    isMeasuredPath(path) &&
    sourceKindOf(path) === SourceKind.Production &&
    sideByArea[areaOf(path)] !== undefined &&
    analysedExtensions.has(extensionOf(path))
  );
}

export function complexityByFile(
  functions: readonly ComplexFunction[],
): Map<string, FileComplexity> {
  const byFile = new Map<string, FileComplexity>();
  for (const entry of functions) {
    const file = byFile.get(entry.path) ?? unmeasured;
    byFile.set(entry.path, {
      total: file.total + entry.complexity,
      maximum: Math.max(file.maximum, entry.complexity),
      functions: file.functions + 1,
    });
  }
  return byFile;
}

function sideOf(path: string): RepositorySide {
  const side = sideByArea[areaOf(path)];
  if (side === undefined) {
    throw new Error(
      `${path} is neither backend nor frontend source; rank hotspot candidates only.`,
    );
  }
  return side;
}

function scoreFile(
  path: string,
  history: ChurnHistory,
  complexity: ReadonlyMap<string, FileComplexity>,
): Hotspot {
  const churn = history.byPath.get(path) ?? { commits: 0, linesChanged: 0 };
  const file = complexity.get(path) ?? unmeasured;
  return {
    path,
    side: sideOf(path),
    commits: churn.commits,
    linesChanged: churn.linesChanged,
    complexity: file.total,
    mostComplexFunction: file.maximum,
    score: churn.commits * file.total,
  };
}

export function rankHotspots(
  paths: readonly string[],
  history: ChurnHistory,
  functions: readonly ComplexFunction[],
): HotspotMetrics {
  if (paths.length === 0) {
    throw new Error(
      "The hotspot analysis found no production code file to rank.",
    );
  }
  const complexity = complexityByFile(functions);
  const scored = paths
    .map((path) => scoreFile(path, history, complexity))
    .sort(
      (left, right) =>
        right.score - left.score || left.path.localeCompare(right.path),
    );
  return {
    filesAnalysed: scored.length,
    commitsInHistory: history.commits,
    hotspots: scored.slice(0, reportedHotspots),
  };
}

export function collectHotspots(
  context: CollectionContext,
  tracked: TrackedFileListing,
  commit: CommitStamp,
  functions: readonly ComplexFunction[],
): MetricGroup<HotspotMetrics> {
  const log = runInRepository(context, "git", churnLogArguments(commit.sha));
  return {
    commands: recorded(context, tracked.listing, log),
    ...rankHotspots(
      tracked.paths.filter(isHotspotCandidate),
      parseChurnLog(log.stdout),
      functions,
    ),
  };
}
