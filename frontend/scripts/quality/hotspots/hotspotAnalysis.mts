import {
  readRepositoryFile,
  recorded,
  runInRepository,
  type CollectionContext,
  type TrackedFileListing,
} from "../collectionContext.mts";
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
import { indentUnitOf, measureIndentation } from "./indentationComplexity.mts";

export interface AnalysedFile {
  path: string;
  content: string;
}

export interface Hotspot {
  path: string;
  side: RepositorySide;
  commits: number;
  linesChanged: number;
  complexity: number;
  maximumDepth: number;
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

export function isHotspotCandidate(path: string): boolean {
  return (
    isMeasuredPath(path) &&
    sourceKindOf(path) === SourceKind.Production &&
    sideByArea[areaOf(path)] !== undefined &&
    analysedExtensions.has(extensionOf(path))
  );
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

function scoreFile(file: AnalysedFile, history: ChurnHistory): Hotspot {
  const churn = history.byPath.get(file.path) ?? {
    commits: 0,
    linesChanged: 0,
  };
  const indentation = measureIndentation(file.content, indentUnitOf(file.path));
  return {
    path: file.path,
    side: sideOf(file.path),
    commits: churn.commits,
    linesChanged: churn.linesChanged,
    complexity: indentation.total,
    maximumDepth: indentation.maximumDepth,
    score: churn.commits * indentation.total,
  };
}

export function rankHotspots(
  files: readonly AnalysedFile[],
  history: ChurnHistory,
): HotspotMetrics {
  if (files.length === 0) {
    throw new Error(
      "The hotspot analysis found no production code file to rank.",
    );
  }
  const scored = files
    .map((file) => scoreFile(file, history))
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
): MetricGroup<HotspotMetrics> {
  const log = runInRepository(context, "git", churnLogArguments(commit.sha));
  const files = tracked.paths.filter(isHotspotCandidate).map((path) => ({
    path,
    content: readRepositoryFile(context, path),
  }));
  return {
    commands: recorded(context, tracked.listing, log),
    ...rankHotspots(files, parseChurnLog(log.stdout)),
  };
}
