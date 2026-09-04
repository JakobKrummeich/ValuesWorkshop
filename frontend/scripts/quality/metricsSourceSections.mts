import {
  ColumnAlignment,
  formatCount,
  markdownTable,
  measureTable,
  section,
} from "./markdownTable.mts";
import {
  contractFixturesTable,
  filesByLanguageTable,
  tokenFilesTable,
} from "./metricsDetailTables.mts";
import type { QualityReport } from "./qualityReport.mts";

const left = ColumnAlignment.Left;
const right = ColumnAlignment.Right;

export function header(report: QualityReport): string {
  return [
    "# Measured quality",
    "Every number on this page is read back from a tool run, and the commands that produced a group are printed with it. Nothing here is written by hand: regenerate the page with `pnpm quality:report`.",
    markdownTable(
      ["the report describes", ""],
      [left, left],
      [
        ["commit", `\`${report.commit.shortSha}\` — ${report.commit.subject}`],
        ["committed", report.commit.committedAt],
        ["report generated", report.generatedAt],
      ],
    ),
  ].join("\n\n");
}

export function sizeSection(report: QualityReport): string {
  const areaRows = report.size.areas.map((area) => [
    area.area,
    formatCount(area.files),
    formatCount(area.productionLines),
    formatCount(area.testLines),
    formatCount(area.totalLines),
  ]);
  return section("Size", report.size.commands, [
    "Line counts cover every tracked text file except binary assets and generated ones — lock files, EF Core migrations, the generated phase module and this report. A file counts as test code when it sits in `*.Tests/`, `__tests__/`, `TestSupport` or `e2e/`, or is named `*.test.*` or `*.spec.*`.",
    markdownTable(
      ["area", "files", "production lines", "test lines", "total lines"],
      [left, right, right, right, right],
      [
        ...areaRows,
        [
          "**repository**",
          `**${formatCount(report.size.files)}**`,
          `**${formatCount(report.size.productionLines)}**`,
          `**${formatCount(report.size.testLines)}**`,
          `**${formatCount(report.size.totalLines)}**`,
        ],
      ],
    ),
    filesByLanguageTable(report),
  ]);
}

export function designSystemSection(report: QualityReport): string {
  const designSystem = report.designSystem;
  return section("Design system", report.designSystem.commands, [
    measureTable([
      ["distinct design tokens", formatCount(designSystem.customProperties)],
      ["co-located CSS modules", formatCount(designSystem.cssModules)],
      [
        "contrast assertions over the token layers",
        formatCount(designSystem.contrastAssertions),
      ],
    ]),
    tokenFilesTable(report),
  ]);
}

export function contractSection(report: QualityReport): string {
  const contract = report.contract;
  return section("Wire contract", report.contract.commands, [
    measureTable([
      ["checked-in wire state fixtures", formatCount(contract.fixtures)],
      [
        "frontend assertions over the fixtures",
        formatCount(contract.frontendAssertions),
      ],
      [
        "backend contract test methods",
        formatCount(contract.backendTestMethods),
      ],
    ]),
    contractFixturesTable(report),
  ]);
}

export function processSection(report: QualityReport): string {
  return section("Process", report.process.commands, [
    "The history is counted at the commit this report describes, not at the branch tip, so regenerating the report does not move its own numbers.",
    measureTable([
      ["commits", formatCount(report.process.commits)],
      [
        "merge commits from pull requests",
        formatCount(report.process.mergedPullRequests),
      ],
      ["first commit", report.process.firstCommitDate],
      ["contributors", formatCount(report.process.contributors)],
    ]),
  ]);
}
