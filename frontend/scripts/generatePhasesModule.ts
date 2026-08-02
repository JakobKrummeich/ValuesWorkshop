import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  checkedInPhasesModulePath,
  findPhaseEnumDrift,
  parsePhaseEnumMembers,
  phaseEnumSourcePath,
  renderPhasesModule,
} from "./phaseEnumCodegen.ts";

const repositoryRoot = resolve(import.meta.dirname, "../..");
const csharpFile = resolve(repositoryRoot, phaseEnumSourcePath);
const typescriptFile = resolve(repositoryRoot, checkedInPhasesModulePath);

function reportFailure(lines: string[]): never {
  process.stderr.write(`${lines.join("\n")}\n`);
  process.exit(1);
}

function runCheck(csharpSource: string): void {
  const drift = findPhaseEnumDrift(
    csharpSource,
    readFileSync(typescriptFile, "utf8"),
  );
  if (drift.length > 0) {
    reportFailure([
      `${checkedInPhasesModulePath} is out of sync with ${phaseEnumSourcePath}:`,
      ...drift.map((message) => `  - ${message}`),
      "Run `pnpm --dir frontend phases:generate` and commit the result.",
    ]);
  }
  process.stdout.write(
    `${checkedInPhasesModulePath} is in sync with ${phaseEnumSourcePath}\n`,
  );
}

function runWrite(csharpSource: string): void {
  writeFileSync(
    typescriptFile,
    renderPhasesModule(parsePhaseEnumMembers(csharpSource)),
  );
  process.stdout.write(
    `Wrote ${checkedInPhasesModulePath} from ${phaseEnumSourcePath}\n`,
  );
}

const mode = process.argv[2];

try {
  const csharpSource = readFileSync(csharpFile, "utf8");
  if (mode === "--check") {
    runCheck(csharpSource);
  } else if (mode === "--write") {
    runWrite(csharpSource);
  } else {
    reportFailure([
      "Usage: node scripts/generatePhasesModule.ts --check|--write",
    ]);
  }
} catch (error) {
  reportFailure([error instanceof Error ? error.message : String(error)]);
}
