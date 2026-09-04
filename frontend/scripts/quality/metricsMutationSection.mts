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

function currency(report: QualityReport): string {
  return sides
    .map((side) => {
      const measurement = report.mutation[side];
      if (!measurement) {
        return `No ${side} run is recorded, so the ${side} score is absent rather than zero.`;
      }
      if (measurement.commit === report.commit.sha) {
        return `The ${side} score was measured at \`${report.commit.shortSha}\`, the commit this report describes.`;
      }
      return `The ${side} score was measured at \`${shortSha(measurement.commit)}\`, not at \`${report.commit.shortSha}\` — the commit this report describes — so it does not describe the code as it stands.`;
    })
    .join(" ");
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
