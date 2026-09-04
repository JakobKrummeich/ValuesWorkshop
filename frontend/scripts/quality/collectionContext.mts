import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  redactTemporaryPaths,
  runCommand,
  runCommandExpecting,
  type CommandResult,
} from "./commandRunner.mts";
import { parseTrackedFilePaths } from "./sizeScan.mts";

export interface CollectionContext {
  repositoryRoot: string;
  frontendDirectory: string;
  temporaryDirectory: string;
}

export interface TrackedFileListing {
  paths: string[];
  listing: CommandResult;
}

export function readRepositoryFile(
  context: CollectionContext,
  path: string,
): string {
  return readFileSync(resolve(context.repositoryRoot, path), "utf8");
}

export function runInRepository(
  context: CollectionContext,
  command: string,
  args: readonly string[],
): CommandResult {
  return runCommand({ command, args, cwd: context.repositoryRoot });
}

export function runInFrontend(
  context: CollectionContext,
  command: string,
  args: readonly string[],
  acceptedExitCodes: readonly number[],
): CommandResult {
  return runCommandExpecting(
    { command, args, cwd: context.frontendDirectory },
    acceptedExitCodes,
  );
}

export function recorded(
  context: CollectionContext,
  ...results: readonly CommandResult[]
): string[] {
  return results.map((result) =>
    redactTemporaryPaths(result.commandLine, context.temporaryDirectory),
  );
}

export function collectTrackedPaths(
  context: CollectionContext,
): TrackedFileListing {
  const listing = runInRepository(context, "git", ["ls-files"]);
  return { paths: parseTrackedFilePaths(listing.stdout), listing };
}
