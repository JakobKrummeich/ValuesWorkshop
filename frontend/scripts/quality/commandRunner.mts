import { spawnSync } from "node:child_process";

export interface CommandSpecification {
  command: string;
  args: readonly string[];
  cwd: string;
  environment?: Readonly<Record<string, string>>;
}

export interface CommandResult {
  commandLine: string;
  exitCode: number;
  stdout: string;
  stderr: string;
}

const outputLimitInBytes = 64 * 1024 * 1024;
const reportedFailureLines = 20;

export function commandLineOf(
  command: string,
  args: readonly string[],
): string {
  return [command, ...args]
    .map((part) => (/[\s"']/.test(part) ? JSON.stringify(part) : part))
    .join(" ");
}

function lastLines(output: string): string {
  return output.trim().split("\n").slice(-reportedFailureLines).join("\n");
}

export function runCommandExpecting(
  specification: CommandSpecification,
  acceptedExitCodes: readonly number[],
): CommandResult {
  const commandLine = commandLineOf(specification.command, specification.args);
  const finished = spawnSync(specification.command, [...specification.args], {
    cwd: specification.cwd,
    encoding: "utf8",
    env: { ...process.env, ...specification.environment },
    maxBuffer: outputLimitInBytes,
  });
  if (finished.error) {
    throw new Error(
      `The quality report could not start \`${commandLine}\`: ${finished.error.message}`,
    );
  }
  const exitCode = finished.status ?? 1;
  if (!acceptedExitCodes.includes(exitCode)) {
    throw new Error(
      [
        `The quality report depends on \`${commandLine}\`, which exited with ${exitCode}.`,
        lastLines(`${finished.stdout}\n${finished.stderr}`),
      ].join("\n"),
    );
  }
  return {
    commandLine,
    exitCode,
    stdout: finished.stdout,
    stderr: finished.stderr,
  };
}

export function runCommand(specification: CommandSpecification): CommandResult {
  return runCommandExpecting(specification, [0]);
}

export function redactTemporaryPaths(
  commandLine: string,
  temporaryDirectory: string,
): string {
  return commandLine.replaceAll(temporaryDirectory, "<tmp>");
}
