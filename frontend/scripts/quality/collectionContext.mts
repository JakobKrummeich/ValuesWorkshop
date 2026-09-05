import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  redactTemporaryPaths,
  runCommand,
  runCommandExpecting,
  type CommandResult,
} from "./commandRunner.mts";
import { parseTrackedFilePaths } from "./sizeScan.mts";

export interface RepositoryLocations {
  repositoryRoot: string;
  frontendDirectory: string;
}

export interface CollectionContext extends RepositoryLocations {
  temporaryDirectory: string;
}

export interface TrackedFileListing {
  paths: string[];
  listing: CommandResult;
}

export function readRepositoryFile(
  locations: RepositoryLocations,
  path: string,
): string {
  return readFileSync(resolve(locations.repositoryRoot, path), "utf8");
}

export function runInRepository(
  locations: RepositoryLocations,
  command: string,
  args: readonly string[],
): CommandResult {
  return runCommand({ command, args, cwd: locations.repositoryRoot });
}

export function runInFrontend(
  locations: RepositoryLocations,
  command: string,
  args: readonly string[],
  acceptedExitCodes: readonly number[],
): CommandResult {
  return runCommandExpecting(
    { command, args, cwd: locations.frontendDirectory },
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
  locations: RepositoryLocations,
): TrackedFileListing {
  const listing = runInRepository(locations, "git", ["ls-files"]);
  return { paths: parseTrackedFilePaths(listing.stdout), listing };
}
