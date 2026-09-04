export const noKnownAdvisoriesReport =
  "No known advisories in the scanned lockfile and bills of materials";

export interface AdvisoryScanRunResult {
  exitCode: number;
  stdout: string;
  stderr: string;
}

export type AdvisoryScanOutcome =
  | { kind: "clean" }
  | { kind: "advisories"; report: string }
  | { kind: "databaseUnreachable"; report: string };

export interface AdvisoryScanOptions {
  runScan: () => Promise<AdvisoryScanRunResult>;
  attempts: number;
  wait: (attempt: number) => Promise<void>;
}

export interface AdvisoryScanOutcomeReport {
  exitCode: number;
  report: string;
}

const advisoriesFoundExitCode = 1;

export function classifyAdvisoryScanRun(
  result: AdvisoryScanRunResult,
): AdvisoryScanOutcome {
  if (result.exitCode === 0) {
    return { kind: "clean" };
  }
  if (result.exitCode === advisoriesFoundExitCode) {
    return { kind: "advisories", report: result.stdout };
  }
  return {
    kind: "databaseUnreachable",
    report: result.stderr.trim().length > 0 ? result.stderr : result.stdout,
  };
}

export async function scanForAdvisories({
  runScan,
  attempts,
  wait,
}: AdvisoryScanOptions): Promise<AdvisoryScanOutcomeReport> {
  let lastUnreachableReport = "";
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    const outcome = classifyAdvisoryScanRun(await runScan());
    if (outcome.kind === "clean") {
      return { exitCode: 0, report: noKnownAdvisoriesReport };
    }
    if (outcome.kind === "advisories") {
      return {
        exitCode: 1,
        report: ["Known advisories found:", outcome.report].join("\n"),
      };
    }
    lastUnreachableReport = outcome.report;
    if (attempt < attempts) {
      await wait(attempt);
    }
  }
  return {
    exitCode: 1,
    report: [
      `The OSV database stayed unreachable across ${attempts} attempts, so the dependency tree is unscanned:`,
      lastUnreachableReport,
    ].join("\n"),
  };
}
