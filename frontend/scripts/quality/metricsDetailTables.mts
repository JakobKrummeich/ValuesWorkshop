import {
  ColumnAlignment,
  formatCount,
  markdownTable,
} from "./markdownTable.mts";
import type { ComplexityBucket } from "./complexityScan.mts";
import type { QualityReport } from "./qualityReport.mts";
import { RepositorySide, SourceKind } from "./sizeScan.mts";

const left = ColumnAlignment.Left;
const right = ColumnAlignment.Right;

const languagesReported = 12;

export function filesByLanguageTable(report: QualityReport): string {
  return markdownTable(
    ["extension", "files"],
    [left, right],
    report.size.filesByExtension
      .slice(0, languagesReported)
      .map((entry) => [
        entry.extension === "none"
          ? "without an extension"
          : `\`.${entry.extension}\``,
        formatCount(entry.files),
      ]),
  );
}

export function backendAssembliesTable(report: QualityReport): string {
  return markdownTable(
    ["backend test assembly", "tests"],
    [left, right],
    report.tests.backend.assemblies.map((assembly) => [
      `\`${assembly.assembly}\``,
      formatCount(assembly.total),
    ]),
  );
}

function functionsAt(
  buckets: readonly ComplexityBucket[],
  complexity: number,
): string {
  const bucket = buckets.find(
    (candidate) => candidate.complexity === complexity,
  );
  return formatCount(bucket?.functions ?? 0);
}

export function complexityDistributionTable(report: QualityReport): string {
  const { frontend, backend } = report.complexity;
  const complexities = [
    ...new Set(
      [...frontend.distribution, ...backend.distribution].map(
        (bucket) => bucket.complexity,
      ),
    ),
  ].sort((left, right) => left - right);
  return markdownTable(
    ["cyclomatic complexity", "frontend functions", "backend functions"],
    [right, right, right],
    complexities.map((complexity) => [
      formatCount(complexity),
      functionsAt(frontend.distribution, complexity),
      functionsAt(backend.distribution, complexity),
    ]),
  );
}

export function mostComplexFunctionsTable(
  report: QualityReport,
  side: RepositorySide,
): string {
  return markdownTable(
    [`most complex ${side} functions`, "file", "complexity"],
    [left, left, right],
    report.complexity[side].mostComplex.map((entry) => [
      entry.name,
      `\`${entry.path}:${entry.line}\``,
      formatCount(entry.complexity),
    ]),
  );
}

export function longestFilesTable(report: QualityReport): string {
  return markdownTable(
    ["side", "kind", "longest file", "lines", "enforced cap"],
    [left, left, left, right, left],
    report.complexity.longestFiles.map((file) => [
      file.side,
      file.kind,
      `\`${file.path}\``,
      formatCount(file.lineCount),
      enforcedFileLengthCap(report, file.side, file.kind),
    ]),
  );
}

function enforcedFileLengthCap(
  report: QualityReport,
  side: RepositorySide,
  kind: SourceKind,
): string {
  const limits = report.enforcedLimits;
  const caps =
    side === RepositorySide.Backend
      ? {
          production: limits.backendProductionFileLines,
          test: limits.backendTestFileLines,
        }
      : {
          production: limits.frontendProductionFileLines,
          test: limits.frontendTestFileLines,
        };
  return `at most ${formatCount(kind === SourceKind.Test ? caps.test : caps.production)}`;
}

export function largestClonesTable(report: QualityReport): string {
  if (report.duplication.largestClones.length === 0) {
    return "No clone of at least the configured window was found.";
  }
  return markdownTable(
    ["largest clone", "tokens", "lines"],
    [left, right, right],
    report.duplication.largestClones.map((clone) => [
      `\`${clone.firstPath}\` ↔ \`${clone.secondPath}\``,
      formatCount(clone.tokens),
      formatCount(clone.lines),
    ]),
  );
}

export function folderInstabilityTable(report: QualityReport): string {
  return markdownTable(
    ["folder", "incoming", "outgoing", "instability"],
    [left, right, right, right],
    report.architecture.folderInstability.map((folder) => [
      `\`${folder.folder}\``,
      formatCount(folder.afferentCouplings),
      formatCount(folder.efferentCouplings),
      folder.instability.toFixed(2),
    ]),
  );
}

export function backendArchitectureRulesTable(report: QualityReport): string {
  return markdownTable(
    ["ArchUnitNET rule asserted on the backend"],
    [left],
    report.architecture.backendRuleNames.map((rule) => [rule]),
  );
}

export function tokenFilesTable(report: QualityReport): string {
  return markdownTable(
    ["token layer", "custom properties"],
    [left, right],
    report.designSystem.tokenFiles.map((file) => [
      `\`${file.path}\``,
      formatCount(file.customProperties),
    ]),
  );
}

export function contractFixturesTable(report: QualityReport): string {
  return markdownTable(
    ["wire role", "checked-in state fixtures"],
    [left, right],
    report.contract.fixtureGroups.map((group) => [
      group.role,
      formatCount(group.fixtures),
    ]),
  );
}
