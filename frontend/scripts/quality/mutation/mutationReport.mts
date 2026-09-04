import { z } from "zod";

const mutationTestingReportSchema = z.object({
  files: z.record(
    z.string(),
    z.object({ mutants: z.array(z.object({ status: z.string() })) }),
  ),
});

export interface MutationOutcome {
  score: number;
  killed: number;
  survived: number;
  timeout: number;
  noCoverage: number;
}

const detectedStatuses = ["Killed", "Timeout"];
const undetectedStatuses = ["Survived", "NoCoverage"];

function countStatus(statuses: readonly string[], wanted: string): number {
  return statuses.filter((status) => status === wanted).length;
}

function scoreOf(statuses: readonly string[]): number {
  const detected = statuses.filter((status) =>
    detectedStatuses.includes(status),
  ).length;
  const undetected = statuses.filter((status) =>
    undetectedStatuses.includes(status),
  ).length;
  if (detected + undetected === 0) {
    throw new Error(
      "The mutation report contains no mutant that was either detected or left undetected.",
    );
  }
  return Math.round((detected / (detected + undetected)) * 100 * 100) / 100;
}

export function summarizeMutationReport(reportJson: string): MutationOutcome {
  const report = mutationTestingReportSchema.parse(JSON.parse(reportJson));
  const statuses = Object.values(report.files).flatMap((file) =>
    file.mutants.map((mutant) => mutant.status),
  );
  return {
    score: scoreOf(statuses),
    killed: countStatus(statuses, "Killed"),
    survived: countStatus(statuses, "Survived"),
    timeout: countStatus(statuses, "Timeout"),
    noCoverage: countStatus(statuses, "NoCoverage"),
  };
}
