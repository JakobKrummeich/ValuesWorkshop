import {
  formatAtMost,
  formatAtMostPercentage,
  formatCount,
  formatPercentage,
} from "./markdownTable.mts";
import type { QualityReport } from "./qualityReport.mts";
import { RepositorySide, SourceKind } from "./sizeScan.mts";

export function lines(count: number): string {
  return `${formatCount(count)} lines`;
}

function longestProductionFileLines(
  report: QualityReport,
  side: RepositorySide,
): number {
  const longest = report.complexity.longestFiles.find(
    (file) => file.side === side && file.kind === SourceKind.Production,
  );
  if (!longest) {
    throw new Error(
      `The report names no longest production file for the ${side}.`,
    );
  }
  return longest.lineCount;
}

export function complexityRow(report: QualityReport): string[] {
  const limits = report.enforcedLimits;
  return [
    "Cyclomatic complexity",
    `highest ${formatCount(report.complexity.frontend.maximum)} (${formatAtMost(limits.frontendComplexity)})`,
    `${formatCount(report.complexity.backendAnalyzerDiagnostics)} functions above ${formatCount(limits.backendComplexity)}`,
    "eslint `complexity` / analyzer VW1001",
  ];
}

export function longestFileRow(report: QualityReport): string[] {
  const limits = report.enforcedLimits;
  return [
    "Longest production file",
    `${lines(longestProductionFileLines(report, RepositorySide.Frontend))} (${formatAtMost(limits.frontendProductionFileLines)})`,
    `${lines(longestProductionFileLines(report, RepositorySide.Backend))} (${formatAtMost(limits.backendProductionFileLines)})`,
    "eslint `max-lines` / analyzer VW1002",
  ];
}

export function duplicationRow(report: QualityReport): string[] {
  const share = `${formatPercentage(report.duplication.duplicatedTokenPercentage)} (${formatAtMostPercentage(report.enforcedLimits.duplicationPercentage)})`;
  return [
    "Duplicated tokens",
    share,
    share,
    "`jscpd`, one scan over both sides",
  ];
}

export function architectureRow(report: QualityReport): string[] {
  const graph = report.architecture.frontend;
  return [
    "Architecture violations",
    `${formatCount(graph.violations)} across ${formatCount(graph.rules)} dependency-cruiser rules`,
    `0 across ${formatCount(report.architecture.backendRules)} ArchUnitNET rules`,
    "dependency-cruiser fails the lint, ArchUnitNET fails the tests",
  ];
}

export function advisoriesRow(report: QualityReport): string[] {
  return [
    "Known advisories",
    formatCount(report.security.frontend.findings),
    formatCount(report.security.backend.findings),
    `\`pnpm audit\` / \`dotnet list package --vulnerable\`; osv-scanner over the lockfile and both SBOMs finds ${formatCount(report.supplyChain.advisories.findings)}`,
  ];
}
