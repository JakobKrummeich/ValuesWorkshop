import { spawn } from "node:child_process";

export interface AuditRunResult {
  exitCode: number;
  stdout: string;
  stderr: string;
}

export type AuditOutcome =
  | { kind: "clean" }
  | { kind: "vulnerabilities"; report: string }
  | { kind: "registryUnreachable"; report: string };

export interface AuditDependenciesOptions {
  runAudit: () => Promise<AuditRunResult>;
  attempts: number;
  wait: (attempt: number) => Promise<void>;
}

export interface AuditDependenciesOutcome {
  exitCode: number;
  report: string;
}

function isAdvisoryReport(output: string): boolean {
  try {
    const parsed: unknown = JSON.parse(output);
    return (
      typeof parsed === "object" && parsed !== null && "advisories" in parsed
    );
  } catch {
    return false;
  }
}

export function classifyAuditRun(result: AuditRunResult): AuditOutcome {
  if (result.exitCode === 0) {
    return { kind: "clean" };
  }
  if (isAdvisoryReport(result.stdout)) {
    return { kind: "vulnerabilities", report: result.stdout };
  }
  return {
    kind: "registryUnreachable",
    report: [result.stdout, result.stderr].filter(Boolean).join("\n"),
  };
}

export async function auditDependencies({
  runAudit,
  attempts,
  wait,
}: AuditDependenciesOptions): Promise<AuditDependenciesOutcome> {
  let lastUnreachableReport = "";
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    const outcome = classifyAuditRun(await runAudit());
    if (outcome.kind === "clean") {
      return {
        exitCode: 0,
        report: "No known vulnerabilities of high severity or above",
      };
    }
    if (outcome.kind === "vulnerabilities") {
      return {
        exitCode: 1,
        report: [
          "Vulnerabilities of high severity or above found:",
          outcome.report,
        ].join("\n"),
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
      `The npm advisory registry stayed unreachable across ${attempts} attempts, so the dependency tree is unaudited:`,
      lastUnreachableReport,
    ].join("\n"),
  };
}

function runPnpmAudit(): Promise<AuditRunResult> {
  return new Promise((settle, fail) => {
    const audit = spawn(
      "pnpm",
      ["audit", "--audit-level=high", "--json", "--no-color"],
      { stdio: ["ignore", "pipe", "pipe"] },
    );
    let stdout = "";
    let stderr = "";
    audit.stdout.on("data", (chunk: Buffer) => {
      stdout += chunk.toString();
    });
    audit.stderr.on("data", (chunk: Buffer) => {
      stderr += chunk.toString();
    });
    audit.on("error", fail);
    audit.on("close", (exitCode) => {
      settle({ exitCode: exitCode ?? 1, stdout, stderr });
    });
  });
}

function waitBeforeRetry(attempt: number): Promise<void> {
  const seconds = 5 * 3 ** (attempt - 1);
  process.stdout.write(
    `The npm advisory registry did not answer; retrying in ${seconds}s\n`,
  );
  return new Promise((done) => setTimeout(done, seconds * 1000));
}

function isInvokedAsScript(): boolean {
  return process.argv[1]?.endsWith("auditDependencies.mts") ?? false;
}

if (isInvokedAsScript()) {
  void auditDependencies({
    runAudit: runPnpmAudit,
    attempts: 4,
    wait: waitBeforeRetry,
  }).then((outcome) => {
    const stream = outcome.exitCode === 0 ? process.stdout : process.stderr;
    stream.write(`${outcome.report}\n`);
    process.exit(outcome.exitCode);
  });
}
