import { spawn, spawnSync } from "node:child_process";
import { resolve } from "node:path";
import {
  scanForAdvisories,
  type AdvisoryScanRunResult,
} from "./advisoryScan.mts";
import { billOfMaterialsDirectory } from "./writeBillsOfMaterials.mts";

const scannedLockfile = "pnpm-lock.yaml";

function installedScannerPath(repositoryRoot: string): string {
  const installation = spawnSync("scripts/install-osv-scanner.sh", [], {
    cwd: repositoryRoot,
    encoding: "utf8",
  });
  if (installation.status !== 0) {
    throw new Error(
      `The pinned osv-scanner could not be installed: ${installation.stderr}`,
    );
  }
  return installation.stdout.trim();
}

function runScanner(
  repositoryRoot: string,
  scannerPath: string,
): Promise<AdvisoryScanRunResult> {
  return new Promise((settle, fail) => {
    const scan = spawn(
      scannerPath,
      [
        "scan",
        "source",
        "--lockfile",
        scannedLockfile,
        billOfMaterialsDirectory,
        "--format",
        "json",
      ],
      { cwd: repositoryRoot, stdio: ["ignore", "pipe", "pipe"] },
    );
    let stdout = "";
    let stderr = "";
    scan.stdout.on("data", (chunk: Buffer) => {
      stdout += chunk.toString();
    });
    scan.stderr.on("data", (chunk: Buffer) => {
      stderr += chunk.toString();
    });
    scan.on("error", fail);
    scan.on("close", (exitCode) => {
      settle({ exitCode: exitCode ?? 1, stdout, stderr });
    });
  });
}

function waitBeforeRetry(attempt: number): Promise<void> {
  const seconds = 5 * 3 ** (attempt - 1);
  process.stdout.write(
    `The OSV database did not answer; retrying in ${seconds}s\n`,
  );
  return new Promise((done) => setTimeout(done, seconds * 1000));
}

function isInvokedAsScript(): boolean {
  return process.argv[1]?.endsWith("scanDependencyAdvisories.mts") ?? false;
}

if (isInvokedAsScript()) {
  const repositoryRoot = resolve(process.cwd(), "..");
  const scannerPath = installedScannerPath(repositoryRoot);
  void scanForAdvisories({
    runScan: () => runScanner(repositoryRoot, scannerPath),
    attempts: 4,
    wait: waitBeforeRetry,
  }).then((outcome) => {
    const stream = outcome.exitCode === 0 ? process.stdout : process.stderr;
    stream.write(`${outcome.report}\n`);
    process.exit(outcome.exitCode);
  });
}
