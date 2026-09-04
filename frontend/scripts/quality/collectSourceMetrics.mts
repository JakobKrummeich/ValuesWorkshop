import {
  readRepositoryFile,
  recorded,
  runInRepository,
  type CollectionContext,
  type TrackedFileListing,
} from "./collectionContext.mts";
import { summarizeContract, type ContractMetrics } from "./contractScan.mts";
import {
  summarizeDesignSystem,
  type DesignSystemMetrics,
} from "./designSystemScan.mts";
import { readEnforcedLimits, type EnforcedLimits } from "./enforcedLimits.mts";
import {
  summarizeProcessHistory,
  type ProcessMetrics,
} from "./processHistory.mts";
import {
  parseCommitStamp,
  type CommitStamp,
  type MetricGroup,
} from "./qualityReport.mts";
import {
  countLines,
  isMeasuredPath,
  summarizeSize,
  type MeasuredFile,
  type SizeMetrics,
} from "./sizeScan.mts";
import { parseTestMethodNames } from "./csharpTestMethods.mts";

const tokenStyleSheetPath = /^frontend\/src\/.*\/tokens[^/]*\.css$/;
const backendContractTest = "backend/Adapters.Tests/WireStateContractTests.cs";

export function collectCommitStamp(context: CollectionContext): CommitStamp {
  return parseCommitStamp(
    runInRepository(context, "git", [
      "log",
      "-1",
      "--format=%H%n%cI%n%s",
      "--",
      ".",
      ":(exclude)docs/quality",
    ]).stdout,
  );
}

export function collectEnforcedLimits(
  context: CollectionContext,
): EnforcedLimits {
  return readEnforcedLimits({
    eslintConfig: readRepositoryFile(context, "frontend/eslint.config.mjs"),
    jestConfig: readRepositoryFile(context, "frontend/jest.config.mjs"),
    cyclomaticComplexityAnalyzer: readRepositoryFile(
      context,
      "backend/Analyzers/CyclomaticComplexityAnalyzer.cs",
    ),
    fileLengthAnalyzer: readRepositoryFile(
      context,
      "backend/Analyzers/FileLengthAnalyzer.cs",
    ),
    duplicationConfig: readRepositoryFile(context, ".jscpd.json"),
    backendCoverageScript: readRepositoryFile(
      context,
      "scripts/test-backend-with-coverage.sh",
    ),
  });
}

export function collectSize(
  context: CollectionContext,
  tracked: TrackedFileListing,
): MetricGroup<SizeMetrics> {
  const measured: MeasuredFile[] = tracked.paths
    .filter(isMeasuredPath)
    .map((path) => ({
      path,
      lineCount: countLines(readRepositoryFile(context, path)),
    }));
  return {
    commands: recorded(context, tracked.listing),
    ...summarizeSize(measured),
  };
}

export function collectDesignSystem(
  context: CollectionContext,
  tracked: TrackedFileListing,
  contrastAssertions: number,
): MetricGroup<DesignSystemMetrics> {
  const tokenStyleSheets = tracked.paths
    .filter((path) => tokenStyleSheetPath.test(path))
    .map((path) => ({ path, content: readRepositoryFile(context, path) }));
  return {
    commands: recorded(context, tracked.listing),
    ...summarizeDesignSystem(
      tokenStyleSheets,
      tracked.paths,
      contrastAssertions,
    ),
  };
}

export function collectContract(
  context: CollectionContext,
  tracked: TrackedFileListing,
  frontendAssertions: number,
): MetricGroup<ContractMetrics> {
  return {
    commands: recorded(context, tracked.listing),
    ...summarizeContract(
      tracked.paths,
      frontendAssertions,
      parseTestMethodNames(readRepositoryFile(context, backendContractTest))
        .length,
    ),
  };
}

export function collectProcess(
  context: CollectionContext,
  commit: CommitStamp,
): MetricGroup<ProcessMetrics> {
  const commitCount = runInRepository(context, "git", [
    "rev-list",
    "--count",
    commit.sha,
  ]);
  const mergedPullRequests = runInRepository(context, "git", [
    "rev-list",
    "--count",
    "--grep=^Merge pull request",
    commit.sha,
  ]);
  const firstCommit = runInRepository(context, "git", [
    "log",
    "--max-parents=0",
    "--format=%cI",
    commit.sha,
  ]);
  const contributors = runInRepository(context, "git", [
    "shortlog",
    "--summary",
    "--numbered",
    commit.sha,
  ]);
  return {
    commands: recorded(
      context,
      commitCount,
      mergedPullRequests,
      firstCommit,
      contributors,
    ),
    ...summarizeProcessHistory({
      commitCount: commitCount.stdout,
      mergedPullRequests: mergedPullRequests.stdout,
      firstCommitDate: firstCommit.stdout,
      contributors: contributors.stdout,
    }),
  };
}
