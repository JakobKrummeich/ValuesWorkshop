import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  dependencyCruiserArguments,
  parseFolderInstability,
  parseModuleGraph,
  readableRuleName,
} from "./architectureReports.mts";
import { parseTestMethodNames } from "./csharpTestMethods.mts";
import {
  readRepositoryFile,
  recorded,
  runInFrontend,
  runInRepository,
  type CollectionContext,
} from "./collectionContext.mts";
import { parseEslintComplexityReport } from "./complexityScan.mts";
import {
  parseBackendCoverageSummary,
  parseFrontendCoverageSummary,
} from "./coverageReports.mts";
import {
  parseDuplicationReport,
  type DuplicationMetrics,
} from "./duplicationReport.mts";
import {
  toRepositoryPath,
  type ArchitectureGroupMetrics,
  type ComplexityGroupMetrics,
  type MetricGroup,
  type SecurityGroupMetrics,
  type SupplyChainMetrics,
  type TestsMetrics,
} from "./qualityReport.mts";
import {
  summarizeBackendVulnerabilityScan,
  summarizeDependencyAdvisoryScan,
  summarizeFrontendVulnerabilityScan,
} from "./securityScans.mts";
import { countComponents } from "./supplyChain/billsOfMaterials.mts";
import { describedBillsOfMaterials } from "./supplyChain/writeBillsOfMaterials.mts";
import type { SizeMetrics } from "./sizeScan.mts";
import {
  parseBackendTestOutput,
  parseEndToEndTestList,
  parseJestReport,
} from "./testCounts.mts";

export interface TestsCollection {
  group: MetricGroup<TestsMetrics>;
  jestReportJson: string;
}

const instabilityFolders = [
  "src/domain",
  "src/domain/ports",
  "src/adapters",
  "src/shared",
  "src/app",
];

const backendArchitectureTests = [
  "backend/Domain.Tests/ArchitectureTests.cs",
  "backend/Host.Tests/ArchitectureTests.cs",
];

export function collectTests(context: CollectionContext): TestsCollection {
  const jestReportFile = join(context.temporaryDirectory, "jest-report.json");
  const coverageDirectory = join(context.temporaryDirectory, "coverage");
  const jest = runInRepository(context, "pnpm", [
    "--dir",
    "frontend",
    "test",
    "--json",
    `--outputFile=${jestReportFile}`,
    "--coverageReporters=json-summary",
    `--coverageDirectory=${coverageDirectory}`,
  ]);
  const backend = runInRepository(
    context,
    "scripts/test-backend-with-coverage.sh",
    [],
  );
  const endToEnd = runInRepository(context, "npx", [
    "playwright",
    "test",
    "--list",
    "--config",
    "playwright.config.ts",
  ]);
  const jestReportJson = readFileSync(jestReportFile, "utf8");
  const frontendTests = parseJestReport(jestReportJson);
  const frontendCoverage = parseFrontendCoverageSummary(
    readFileSync(join(coverageDirectory, "coverage-summary.json"), "utf8"),
  );
  const backendTests = parseBackendTestOutput(backend.stdout);
  const backendCoverage = parseBackendCoverageSummary(
    readRepositoryFile(context, "backend/TestResults/merged/Summary.txt"),
  );
  const endToEndTests = parseEndToEndTestList(endToEnd.stdout);
  return {
    jestReportJson,
    group: {
      commands: recorded(context, jest, backend, endToEnd),
      totalTests:
        frontendTests.tests + backendTests.tests + endToEndTests.tests,
      frontend: {
        suites: frontendTests.suites,
        tests: frontendTests.tests,
        passed: frontendTests.passed,
        failed: frontendTests.failed,
        skipped: frontendTests.skipped,
        lineCoverage: frontendCoverage.linePercentage,
        branchCoverage: frontendCoverage.branchPercentage,
        coveredLines: frontendCoverage.coveredLines,
        coverableLines: frontendCoverage.coverableLines,
      },
      backend: {
        assemblies: backendTests.assemblies,
        tests: backendTests.tests,
        passed: backendTests.passed,
        failed: backendTests.failed,
        skipped: backendTests.skipped,
        lineCoverage: backendCoverage.linePercentage,
        branchCoverage: backendCoverage.branchPercentage,
        coveredLines: backendCoverage.coveredLines,
        coverableLines: backendCoverage.coverableLines,
      },
      endToEnd: endToEndTests,
    },
  };
}

export function collectComplexity(
  context: CollectionContext,
  size: SizeMetrics,
): MetricGroup<ComplexityGroupMetrics> {
  const eslint = runInFrontend(
    context,
    "npx",
    ["eslint", "--format", "json", "--rule", '{"complexity":["error",0]}'],
    [0, 1],
  );
  const build = runInRepository(context, "dotnet", [
    "build",
    "backend/ValuesWorkshop.All.sln",
  ]);
  const frontend = parseEslintComplexityReport(eslint.stdout);
  return {
    commands: recorded(context, eslint, build),
    frontend: {
      ...frontend,
      mostComplex: frontend.mostComplex.map((entry) => ({
        ...entry,
        path: toRepositoryPath(entry.path, context.repositoryRoot),
      })),
    },
    backendAnalyzerDiagnostics: [...build.stdout.matchAll(/\bVW100\d\b/g)]
      .length,
    longestFiles: size.longestFiles,
  };
}

export function collectDuplication(
  context: CollectionContext,
): MetricGroup<DuplicationMetrics> {
  const reportDirectory = join(context.temporaryDirectory, "jscpd");
  const jscpd = runInRepository(context, "pnpm", [
    "-w",
    "jscpd",
    "--reporters",
    "json",
    "--output",
    reportDirectory,
  ]);
  const duplication = parseDuplicationReport(
    readFileSync(join(reportDirectory, "jscpd-report.json"), "utf8"),
  );
  return {
    commands: recorded(context, jscpd),
    ...duplication,
    largestClones: duplication.largestClones.map((clone) => ({
      ...clone,
      firstPath: toRepositoryPath(clone.firstPath, context.repositoryRoot),
      secondPath: toRepositoryPath(clone.secondPath, context.repositoryRoot),
    })),
  };
}

export function collectArchitecture(
  context: CollectionContext,
): MetricGroup<ArchitectureGroupMetrics> {
  const graph = runInFrontend(context, "npx", dependencyCruiserArguments, [0]);
  const metrics = runInFrontend(
    context,
    "npx",
    [...dependencyCruiserArguments, "--metrics"],
    [0],
  );
  const backendRuleNames = backendArchitectureTests
    .flatMap((path) => parseTestMethodNames(readRepositoryFile(context, path)))
    .map(readableRuleName);
  return {
    commands: recorded(context, graph, metrics),
    frontend: parseModuleGraph(graph.stdout),
    folderInstability: parseFolderInstability(
      metrics.stdout,
      instabilityFolders,
    ),
    backendRules: backendRuleNames.length,
    backendRuleNames,
  };
}

export function collectSecurity(
  context: CollectionContext,
): MetricGroup<SecurityGroupMetrics> {
  const frontend = runInRepository(context, "pnpm", [
    "--dir",
    "frontend",
    "audit:check",
  ]);
  const backend = runInRepository(
    context,
    "scripts/check-backend-vulnerabilities.sh",
    [],
  );
  return {
    commands: recorded(context, frontend, backend),
    frontend: summarizeFrontendVulnerabilityScan(
      frontend.exitCode,
      frontend.stdout,
    ),
    backend: summarizeBackendVulnerabilityScan(
      backend.exitCode,
      backend.stdout,
    ),
  };
}

export function collectSupplyChain(
  context: CollectionContext,
): MetricGroup<SupplyChainMetrics> {
  const generate = runInRepository(context, "pnpm", ["run", "sbom"]);
  const scan = runInRepository(context, "pnpm", ["run", "advisories:scan"]);
  return {
    commands: recorded(context, generate, scan),
    billsOfMaterials: describedBillsOfMaterials.map((bill) => ({
      ...bill,
      components: countComponents(readRepositoryFile(context, bill.path)),
    })),
    advisories: summarizeDependencyAdvisoryScan(scan.exitCode, scan.stdout),
  };
}
