import { z } from "zod";
import type { ComplexityMetrics } from "./complexityScan.mts";
import type { ContractMetrics } from "./contractScan.mts";
import type { DesignSystemMetrics } from "./designSystemScan.mts";
import type { DuplicationMetrics } from "./duplicationReport.mts";
import type { EnforcedLimits } from "./enforcedLimits.mts";
import type {
  FolderInstability,
  ModuleGraphMetrics,
} from "./architectureReports.mts";
import type { ProcessMetrics } from "./processHistory.mts";
import type { SizeMetrics, LongestFile } from "./sizeScan.mts";
import type { VulnerabilityScanResult } from "./securityScans.mts";
import type {
  BackendAssemblyTests,
  EndToEndTestCounts,
} from "./testCounts.mts";

export interface CommitStamp {
  sha: string;
  shortSha: string;
  committedAt: string;
  subject: string;
}

export type MetricGroup<TMetrics> = { commands: readonly string[] } & TMetrics;

export interface CoveredTestSuite {
  tests: number;
  passed: number;
  failed: number;
  skipped: number;
  lineCoverage: number;
  branchCoverage: number;
  coveredLines: number;
  coverableLines: number;
}

export interface TestsMetrics {
  totalTests: number;
  frontend: CoveredTestSuite & { suites: number };
  backend: CoveredTestSuite & { assemblies: BackendAssemblyTests[] };
  endToEnd: EndToEndTestCounts;
}

export interface ComplexityGroupMetrics {
  frontend: ComplexityMetrics;
  backendAnalyzerDiagnostics: number;
  longestFiles: LongestFile[];
}

export interface ArchitectureGroupMetrics {
  frontend: ModuleGraphMetrics;
  folderInstability: FolderInstability[];
  backendRules: number;
  backendRuleNames: string[];
}

export interface SecurityGroupMetrics {
  frontend: VulnerabilityScanResult;
  backend: VulnerabilityScanResult;
}

export type CollectedMetrics = Omit<QualityReport, "generatedAt">;

export interface QualityReport {
  generatedAt: string;
  commit: CommitStamp;
  enforcedLimits: EnforcedLimits;
  size: MetricGroup<SizeMetrics>;
  tests: MetricGroup<TestsMetrics>;
  complexity: MetricGroup<ComplexityGroupMetrics>;
  duplication: MetricGroup<DuplicationMetrics>;
  architecture: MetricGroup<ArchitectureGroupMetrics>;
  designSystem: MetricGroup<DesignSystemMetrics>;
  contract: MetricGroup<ContractMetrics>;
  security: MetricGroup<SecurityGroupMetrics>;
  process: MetricGroup<ProcessMetrics>;
}

const previousReportSchema = z.object({
  generatedAt: z.string(),
  commit: z.object({ sha: z.string() }),
});

export function parseCommitStamp(gitShowOutput: string): CommitStamp {
  const [sha, committedAt, ...subjectLines] = gitShowOutput.trim().split("\n");
  if (!sha || !committedAt || subjectLines.length === 0) {
    throw new Error(
      `git did not describe the commit under measurement; it answered "${gitShowOutput.trim()}".`,
    );
  }
  return {
    sha,
    shortSha: sha.slice(0, 7),
    committedAt,
    subject: subjectLines.join(" "),
  };
}

export function resolveGeneratedAt(
  previousReportJson: string | undefined,
  commitSha: string,
  now: string,
): string {
  if (previousReportJson === undefined) {
    return now;
  }
  const previous = previousReportSchema.safeParse(
    JSON.parse(previousReportJson),
  );
  return previous.success && previous.data.commit.sha === commitSha
    ? previous.data.generatedAt
    : now;
}

export function toRepositoryPath(
  absolutePath: string,
  repositoryRoot: string,
): string {
  const prefix = repositoryRoot.endsWith("/")
    ? repositoryRoot
    : `${repositoryRoot}/`;
  return absolutePath.startsWith(prefix)
    ? absolutePath.slice(prefix.length)
    : absolutePath;
}

export function renderQualityReportJson(report: QualityReport): string {
  return `${JSON.stringify(report, null, 2)}\n`;
}
