import {
  ColumnAlignment,
  formatAtLeastPercentage,
  formatAtMost,
  formatAtMostPercentage,
  formatCount,
  formatPercentage,
  markdownTable,
  measureTable,
  section,
} from "./markdownTable.mts";
import {
  backendArchitectureRulesTable,
  backendAssembliesTable,
  complexityDistributionTable,
  folderInstabilityTable,
  largestClonesTable,
  longestFilesTable,
  mostComplexFunctionsTable,
} from "./metricsDetailTables.mts";
import type { QualityReport } from "./qualityReport.mts";
import { RepositorySide } from "./sizeScan.mts";

const left = ColumnAlignment.Left;
const right = ColumnAlignment.Right;
const notMeasured = "—";

export function testsSection(report: QualityReport): string {
  const { frontend, backend, endToEnd } = report.tests;
  return section("Tests and coverage", report.tests.commands, [
    markdownTable(
      [
        "suite",
        "tests",
        "line coverage",
        "enforced minimum",
        "branch coverage",
      ],
      [left, right, right, right, right],
      [
        [
          "jest — frontend units, hooks and components",
          formatCount(frontend.tests),
          formatPercentage(frontend.lineCoverage),
          formatAtLeastPercentage(report.enforcedLimits.frontendLineCoverage),
          formatPercentage(frontend.branchCoverage),
        ],
        [
          "xunit — backend domain, application, adapters and host",
          formatCount(backend.tests),
          formatPercentage(backend.lineCoverage),
          formatAtLeastPercentage(report.enforcedLimits.backendLineCoverage),
          formatPercentage(backend.branchCoverage),
        ],
        [
          "Playwright — end to end through the browser",
          formatCount(endToEnd.tests),
          notMeasured,
          notMeasured,
          notMeasured,
        ],
        [
          "**total**",
          `**${formatCount(report.tests.totalTests)}**`,
          "",
          "",
          "",
        ],
      ],
    ),
    `Coverage is measured over ${formatCount(frontend.coveredLines)} of ${formatCount(frontend.coverableLines)} frontend lines and ${formatCount(backend.coveredLines)} of ${formatCount(backend.coverableLines)} backend lines. The end-to-end suite is listed, never run, by this report.`,
    backendAssembliesTable(report),
  ]);
}

export function complexitySection(report: QualityReport): string {
  const limits = report.enforcedLimits;
  const { frontend, backend } = report.complexity;
  return section("Complexity", report.complexity.commands, [
    markdownTable(
      ["measure", "frontend", "backend"],
      [left, right, right],
      [
        [
          "enforced cyclomatic complexity cap",
          `${formatAtMost(limits.frontendComplexity)} (eslint \`complexity\`)`,
          `${formatAtMost(limits.backendComplexity)} (analyzer VW1001)`,
        ],
        [
          "functions measured",
          formatCount(frontend.functions),
          formatCount(backend.functions),
        ],
        [
          "highest complexity found",
          formatCount(frontend.maximum),
          formatCount(backend.maximum),
        ],
        ["mean complexity", frontend.mean.toFixed(2), backend.mean.toFixed(2)],
        [
          "functions above the cap",
          formatCount(frontend.aboveCap),
          formatCount(backend.aboveCap),
        ],
      ],
    ),
    "Both sides are measured function by function by the tool that enforces the cap. The frontend re-runs eslint with the cap lowered to zero, which turns every function into a reported finding. The backend rebuilds every project with the analyzer's hidden VW1003 diagnostic promoted to a warning, which reports the cyclomatic complexity of every method, constructor and property with code in it; VW1001 fails the build above the cap, so a report exists only for a backend that passes it.",
    complexityDistributionTable(report),
    mostComplexFunctionsTable(report, RepositorySide.Frontend),
    mostComplexFunctionsTable(report, RepositorySide.Backend),
    longestFilesTable(report),
  ]);
}

export function duplicationSection(report: QualityReport): string {
  const duplication = report.duplication;
  const limits = report.enforcedLimits;
  return section("Duplication", report.duplication.commands, [
    markdownTable(
      ["measure", "value", "enforced limit"],
      [left, right, right],
      [
        [
          "duplicated lines",
          `${formatCount(duplication.duplicatedLines)} of ${formatCount(duplication.lines)}`,
          "",
        ],
        [
          "duplicated line share",
          formatPercentage(duplication.duplicatedLinePercentage),
          formatAtMostPercentage(limits.duplicationPercentage),
        ],
        [
          "duplicated tokens",
          `${formatCount(duplication.duplicatedTokens)} of ${formatCount(duplication.tokens)}`,
          "",
        ],
        [
          "duplicated token share",
          formatPercentage(duplication.duplicatedTokenPercentage),
          "",
        ],
        ["clones found", formatCount(duplication.clones), ""],
        [
          "detection window",
          `${formatCount(limits.duplicationMinimumTokens)} tokens`,
          "",
        ],
        ["sources scanned", formatCount(duplication.sources), ""],
      ],
    ),
    largestClonesTable(report),
  ]);
}

export function architectureSection(report: QualityReport): string {
  const graph = report.architecture.frontend;
  return section("Architecture", report.architecture.commands, [
    measureTable([
      ["frontend modules cruised", formatCount(graph.modules)],
      ["frontend dependencies cruised", formatCount(graph.dependencies)],
      ["dependency-cruiser rules enforced", formatCount(graph.rules)],
      ["dependency-cruiser violations", formatCount(graph.violations)],
      [
        "modules on a dependency cycle",
        formatCount(graph.circularDependencies),
      ],
      [
        "ArchUnitNET rules asserted on the backend",
        formatCount(report.architecture.backendRules),
      ],
    ]),
    "Instability is dependency-cruiser's own measure: outgoing dependencies over all dependencies, so 0 is a folder everything depends on and 1 is a folder nothing depends on.",
    folderInstabilityTable(report),
    backendArchitectureRulesTable(report),
  ]);
}

export function securitySection(report: QualityReport): string {
  const scans = [
    ["frontend dependencies", report.security.frontend],
    ["backend packages", report.security.backend],
  ] as const;
  return section("Security", report.security.commands, [
    markdownTable(
      ["scan", "findings", "exit code", "reported"],
      [left, right, right, left],
      scans.map(([name, scan]) => [
        name,
        formatCount(scan.findings),
        formatCount(scan.exitCode),
        scan.summary,
      ]),
    ),
  ]);
}

export function supplyChainSection(report: QualityReport): string {
  const advisories = report.supplyChain.advisories;
  return section("Supply chain", report.supplyChain.commands, [
    markdownTable(
      ["bill of materials", "describes", "components"],
      [left, left, right],
      report.supplyChain.billsOfMaterials.map((bill) => [
        `\`${bill.path}\``,
        bill.describes,
        formatCount(bill.components),
      ]),
    ),
    "The bills of materials are CycloneDX documents emitted by the generators and then stripped of the serial number, the run timestamp and the annotation that restates it, so regenerating them against an unchanged dependency set leaves no diff.",
    markdownTable(
      ["scan", "findings", "exit code", "reported"],
      [left, right, right, left],
      [
        [
          "osv-scanner over `pnpm-lock.yaml` and both bills of materials",
          formatCount(advisories.findings),
          formatCount(advisories.exitCode),
          advisories.summary,
        ],
      ],
    ),
  ]);
}
