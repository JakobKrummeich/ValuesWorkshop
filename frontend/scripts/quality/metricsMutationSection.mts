import {
  ColumnAlignment,
  formatCount,
  formatPercentage,
  markdownTable,
  section,
} from "./markdownTable.mts";
import {
  MutationSide,
  mutationCommands,
  type MutationMeasurement,
} from "./mutation/mutationRecord.mts";
import type { QualityReport } from "./qualityReport.mts";

const sides = Object.values(MutationSide);

const explanation =
  "Mutation testing changes the production code and asks whether a test notices. It is far too slow for a pull request, so it runs nightly and on demand, and the scores below are read back from the last recorded run.";

function shortSha(sha: string): string {
  return sha.slice(0, 7);
}

function measurementRow(
  side: MutationSide,
  measurement: MutationMeasurement,
): string[] {
  return [
    side,
    measurement.tool,
    formatPercentage(measurement.score),
    formatCount(measurement.killed),
    formatCount(measurement.survived),
    formatCount(measurement.timeout),
    formatCount(measurement.noCoverage),
    `\`${shortSha(measurement.commit)}\` on ${measurement.measuredAt.slice(0, 10)}`,
  ];
}

function listOf(sidesToList: readonly MutationSide[]): string {
  return sidesToList.join(" and ");
}

function currentSentence(
  current: readonly MutationSide[],
  report: QualityReport,
): string[] {
  if (current.length === 0) {
    return [];
  }
  const subject =
    current.length === sides.length
      ? "Both scores were"
      : `The ${listOf(current)} score was`;
  return [
    `${subject} measured at \`${report.commit.shortSha}\`, the commit this report describes.`,
  ];
}

function staleSentence(
  stale: readonly MutationSide[],
  report: QualityReport,
): string[] {
  if (stale.length === 0) {
    return [];
  }
  const measuredAt = stale
    .flatMap((side) => report.mutation[side] ?? [])
    .map((measurement) => `\`${shortSha(measurement.commit)}\``)
    .join(" and ");
  const plural = stale.length > 1;
  return [
    `The ${listOf(stale)} ${plural ? "scores were" : "score was"} measured at ${measuredAt}, not at \`${report.commit.shortSha}\` — the commit this report describes — so ${plural ? "they describe" : "it describes"} the code as it stood then.`,
  ];
}

function unrecordedSentence(unrecorded: readonly MutationSide[]): string[] {
  if (unrecorded.length === 0) {
    return [];
  }
  if (unrecorded.length === sides.length) {
    return [
      "No run is recorded for either side, so both scores are absent rather than zero.",
    ];
  }
  return [
    `No ${listOf(unrecorded)} run is recorded, so the ${listOf(unrecorded)} score is absent rather than zero.`,
  ];
}

function currency(report: QualityReport): string {
  const current = sides.filter(
    (side) => report.mutation[side]?.commit === report.commit.sha,
  );
  const stale = sides.filter(
    (side) =>
      report.mutation[side] !== undefined &&
      report.mutation[side]?.commit !== report.commit.sha,
  );
  const unrecorded = sides.filter(
    (side) => report.mutation[side] === undefined,
  );
  return [
    ...currentSentence(current, report),
    ...staleSentence(stale, report),
    ...unrecordedSentence(unrecorded),
  ].join(" ");
}

export function mutationSection(report: QualityReport): string {
  const measured = sides.flatMap((side) => {
    const measurement = report.mutation[side];
    return measurement ? [measurementRow(side, measurement)] : [];
  });
  const commands = sides.map(
    (side) => report.mutation[side]?.command ?? mutationCommands[side],
  );
  const table =
    measured.length === 0
      ? []
      : [
          markdownTable(
            [
              "side",
              "tool",
              "mutation score",
              "killed",
              "survived",
              "timed out",
              "not covered",
              "measured at",
            ],
            [
              ColumnAlignment.Left,
              ColumnAlignment.Left,
              ColumnAlignment.Right,
              ColumnAlignment.Right,
              ColumnAlignment.Right,
              ColumnAlignment.Right,
              ColumnAlignment.Right,
              ColumnAlignment.Left,
            ],
            measured,
          ),
        ];
  return section("Mutation testing", commands, [
    explanation,
    ...table,
    currency(report),
  ]);
}
