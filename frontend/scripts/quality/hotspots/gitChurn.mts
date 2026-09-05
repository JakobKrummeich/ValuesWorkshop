export interface PathChurn {
  commits: number;
  linesChanged: number;
}

export interface ChurnHistory {
  commits: number;
  byPath: ReadonlyMap<string, PathChurn>;
}

const commitHash = /^[0-9a-f]{40}$/;
const numstatRow = /^(\d+|-)\t(\d+|-)\t(.+)$/;
const binaryCount = "-";

export function churnLogArguments(commitSha: string): string[] {
  return ["log", "--numstat", "--no-renames", "--format=%H", commitSha];
}

function recordRow(byPath: Map<string, PathChurn>, row: RegExpExecArray): void {
  const [, added, deleted, path] = row;
  if (added === binaryCount || deleted === binaryCount) {
    return;
  }
  const previous = byPath.get(path) ?? { commits: 0, linesChanged: 0 };
  byPath.set(path, {
    commits: previous.commits + 1,
    linesChanged: previous.linesChanged + Number(added) + Number(deleted),
  });
}

export function parseChurnLog(numstatLog: string): ChurnHistory {
  const byPath = new Map<string, PathChurn>();
  let commits = 0;
  for (const line of numstatLog.split("\n")) {
    const row = numstatRow.exec(line);
    if (row) {
      recordRow(byPath, row);
    } else if (commitHash.test(line)) {
      commits += 1;
    } else if (line.length > 0) {
      throw new Error(
        `git printed "${line}", which is neither a commit hash nor a numstat row.`,
      );
    }
  }
  return { commits, byPath };
}
