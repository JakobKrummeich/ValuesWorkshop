import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { z } from "zod";
import { runCommand, type CommandResult } from "../commandRunner.mts";
import {
  MutationSide,
  mutationCommands,
  mutationRecordPath,
  recordMeasurement,
  renderMutationRecord,
} from "./mutationRecord.mts";
import { summarizeMutationReport } from "./mutationReport.mts";
import { readMutationRecord } from "./readMutationRecord.mts";

interface MutationRunner {
  reportPath: string;
  tool: (repositoryRoot: string) => string;
  run: (repositoryRoot: string) => CommandResult;
}

function readJson(repositoryRoot: string, path: string): unknown {
  return JSON.parse(readFileSync(resolve(repositoryRoot, path), "utf8"));
}

function installedStrykerJsVersion(repositoryRoot: string): string {
  const manifest = z
    .object({ version: z.string() })
    .parse(
      readJson(
        repositoryRoot,
        "frontend/node_modules/@stryker-mutator/core/package.json",
      ),
    );
  return `StrykerJS ${manifest.version}`;
}

function pinnedStrykerNetVersion(repositoryRoot: string): string {
  const manifest = z
    .object({
      tools: z.object({ "dotnet-stryker": z.object({ version: z.string() }) }),
    })
    .parse(readJson(repositoryRoot, "dotnet-tools.json"));
  return `Stryker.NET ${manifest.tools["dotnet-stryker"].version}`;
}

const runners: Record<MutationSide, MutationRunner> = {
  [MutationSide.Frontend]: {
    reportPath: "reports/mutation/frontend/report.json",
    tool: installedStrykerJsVersion,
    run: (repositoryRoot) =>
      runCommand({
        command: "npx",
        args: ["stryker", "run"],
        cwd: resolve(repositoryRoot, "frontend"),
      }),
  },
  [MutationSide.Backend]: {
    reportPath: "reports/mutation/backend/reports/mutation-report.json",
    tool: pinnedStrykerNetVersion,
    run: (repositoryRoot) =>
      runCommand({
        command: "dotnet",
        args: [
          "dotnet-stryker",
          "--output",
          "../reports/mutation/backend",
          "--skip-version-check",
        ],
        cwd: resolve(repositoryRoot, "backend"),
      }),
  },
};

function measuredCommit(repositoryRoot: string): string {
  return runCommand({
    command: "git",
    args: ["rev-parse", "HEAD"],
    cwd: repositoryRoot,
  }).stdout.trim();
}

export function runMutationTesting(
  repositoryRoot: string,
  side: MutationSide,
  measuredAt: string,
): string {
  const runner = runners[side];
  runner.run(repositoryRoot);
  const outcome = summarizeMutationReport(
    readFileSync(resolve(repositoryRoot, runner.reportPath), "utf8"),
  );
  const tool = runner.tool(repositoryRoot);
  const updated = recordMeasurement(readMutationRecord(repositoryRoot), side, {
    tool,
    command: mutationCommands[side],
    commit: measuredCommit(repositoryRoot),
    measuredAt,
    ...outcome,
  });
  const file = resolve(repositoryRoot, mutationRecordPath);
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, renderMutationRecord(updated));
  return [
    `${side}: ${outcome.score}% mutation score with ${tool}`,
    `${outcome.killed} killed, ${outcome.survived} survived, ${outcome.timeout} timed out, ${outcome.noCoverage} uncovered`,
    `Wrote ${mutationRecordPath}`,
  ].join("\n");
}

function requestedSide(argument: string | undefined): MutationSide {
  if (argument === MutationSide.Frontend || argument === MutationSide.Backend) {
    return argument;
  }
  throw new Error(
    `Run mutation testing for "${MutationSide.Frontend}" or "${MutationSide.Backend}", not for "${argument ?? ""}".`,
  );
}

function isInvokedAsScript(): boolean {
  return process.argv[1]?.endsWith("runMutationTesting.mts") ?? false;
}

if (isInvokedAsScript()) {
  process.stdout.write(
    `${runMutationTesting(
      resolve(process.cwd(), ".."),
      requestedSide(process.argv[2]),
      new Date().toISOString(),
    )}\n`,
  );
}
