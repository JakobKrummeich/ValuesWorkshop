import {
  ColumnAlignment,
  formatAtLeastPercentage,
  formatCount,
  formatPercentage,
  markdownTable,
} from "./markdownTable.mts";
import { MutationSide } from "./mutation/mutationRecord.mts";
import type { QualityReport } from "./qualityReport.mts";
import {
  advisoriesRow,
  architectureRow,
  complexityRow,
  duplicationRow,
  lines,
  longestFileRow,
} from "./readmeHeadlineGateRows.mts";
import { RepositoryArea, type AreaSize } from "./sizeScan.mts";

const left = ColumnAlignment.Left;
const right = ColumnAlignment.Right;
const notEnforced = "—";
const notYetMeasured = "not yet measured";

function areaSize(report: QualityReport, area: RepositoryArea): AreaSize {
  const size = report.size.areas.find((candidate) => candidate.area === area);
  if (!size) {
    throw new Error(`The report has no size for the area ${area}.`);
  }
  return size;
}

function sizeRow(
  what: string,
  report: QualityReport,
  measure: (area: AreaSize) => number,
): string[] {
  return [
    what,
    lines(measure(areaSize(report, RepositoryArea.FrontendSource))),
    lines(measure(areaSize(report, RepositoryArea.Backend))),
    notEnforced,
  ];
}

function testsRow(report: QualityReport): string[] {
  return [
    "Tests",
    `${formatCount(report.tests.frontend.tests)} jest`,
    `${formatCount(report.tests.backend.tests)} xunit`,
    `\`scripts/ci-test.sh\` on every push, plus ${formatCount(report.tests.endToEnd.tests)} Playwright journeys through a real browser`,
  ];
}

function coverageRow(report: QualityReport): string[] {
  const limits = report.enforcedLimits;
  return [
    "Line coverage",
    `${formatPercentage(report.tests.frontend.lineCoverage)} (${formatAtLeastPercentage(limits.frontendLineCoverage)})`,
    `${formatPercentage(report.tests.backend.lineCoverage)} (${formatAtLeastPercentage(limits.backendLineCoverage)})`,
    "`jest --coverage` / coverlet",
  ];
}

function mutationScore(report: QualityReport, side: MutationSide): string {
  const measurement = report.mutation[side];
  return measurement ? formatPercentage(measurement.score) : notYetMeasured;
}

function mutationRow(report: QualityReport): string[] {
  return [
    "Mutation score",
    mutationScore(report, MutationSide.Frontend),
    mutationScore(report, MutationSide.Backend),
    "Stryker, nightly and on demand",
  ];
}

export function renderHeadlineTable(report: QualityReport): string {
  return markdownTable(
    ["What", "Frontend", "Backend", "Enforced by"],
    [left, right, right, left],
    [
      sizeRow("Production code", report, (area) => area.productionLines),
      sizeRow("Test code", report, (area) => area.testLines),
      testsRow(report),
      coverageRow(report),
      mutationRow(report),
      complexityRow(report),
      longestFileRow(report),
      duplicationRow(report),
      architectureRow(report),
      advisoriesRow(report),
    ],
  );
}
