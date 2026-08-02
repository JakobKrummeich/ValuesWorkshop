import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  checkedInPhasesModulePath,
  parsePhaseEnumMembers,
  phaseEnumSourcePath,
  renderPhasesModule,
  renderPhasesModuleDiff,
} from "./phaseEnumCodegen.mts";

export interface PhaseEnumCodegenFiles {
  csharpFile: string;
  typescriptFile: string;
}

export interface PhaseEnumCodegenOutcome {
  exitCode: number;
  report: string;
}

const usage = "Usage: node scripts/generatePhasesModule.mts --check|--write";

function check(
  generatedModule: string,
  files: PhaseEnumCodegenFiles,
): PhaseEnumCodegenOutcome {
  const checkedInModule = readFileSync(files.typescriptFile, "utf8");
  if (checkedInModule === generatedModule) {
    return {
      exitCode: 0,
      report: `${checkedInPhasesModulePath} is in sync with ${phaseEnumSourcePath}`,
    };
  }
  return {
    exitCode: 1,
    report: [
      `${checkedInPhasesModulePath} is out of sync with ${phaseEnumSourcePath}:`,
      ...renderPhasesModuleDiff(generatedModule, checkedInModule),
      "Run `pnpm --dir frontend phases:generate` and commit the result.",
    ].join("\n"),
  };
}

function write(
  generatedModule: string,
  files: PhaseEnumCodegenFiles,
): PhaseEnumCodegenOutcome {
  writeFileSync(files.typescriptFile, generatedModule);
  return {
    exitCode: 0,
    report: `Wrote ${checkedInPhasesModulePath} from ${phaseEnumSourcePath}`,
  };
}

export function runPhaseEnumCodegen(
  mode: string | undefined,
  files: PhaseEnumCodegenFiles,
): PhaseEnumCodegenOutcome {
  if (mode !== "--check" && mode !== "--write") {
    return { exitCode: 1, report: usage };
  }
  try {
    const generatedModule = renderPhasesModule(
      parsePhaseEnumMembers(readFileSync(files.csharpFile, "utf8")),
    );
    return mode === "--check"
      ? check(generatedModule, files)
      : write(generatedModule, files);
  } catch (error) {
    return {
      exitCode: 1,
      report: error instanceof Error ? error.message : String(error),
    };
  }
}

function repositoryFiles(): PhaseEnumCodegenFiles {
  const repositoryRoot = resolve(process.cwd(), "..");
  return {
    csharpFile: resolve(repositoryRoot, phaseEnumSourcePath),
    typescriptFile: resolve(repositoryRoot, checkedInPhasesModulePath),
  };
}

function isInvokedAsScript(): boolean {
  return process.argv[1]?.endsWith("generatePhasesModule.mts") ?? false;
}

if (isInvokedAsScript()) {
  const outcome = runPhaseEnumCodegen(process.argv[2], repositoryFiles());
  const stream = outcome.exitCode === 0 ? process.stdout : process.stderr;
  stream.write(`${outcome.report}\n`);
  process.exit(outcome.exitCode);
}
