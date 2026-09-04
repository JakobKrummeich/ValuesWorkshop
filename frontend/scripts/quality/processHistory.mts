export interface ProcessHistoryOutputs {
  commitCount: string;
  mergedPullRequests: string;
  firstCommitDate: string;
  contributors: string;
}

export interface ProcessMetrics {
  commits: number;
  mergedPullRequests: number;
  firstCommitDate: string;
  contributors: number;
}

function requiredCount(output: string, description: string): number {
  const value = Number(output.trim());
  if (!Number.isInteger(value)) {
    throw new Error(
      `${description} was not a whole number; git answered "${output.trim()}".`,
    );
  }
  return value;
}

function countLines(output: string): number {
  return output.split("\n").filter((line) => line.trim().length > 0).length;
}

export function summarizeProcessHistory(
  outputs: ProcessHistoryOutputs,
): ProcessMetrics {
  const firstCommitDate =
    outputs.firstCommitDate
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0)
      .sort((left, right) => left.localeCompare(right))[0] ?? "";
  if (firstCommitDate.length === 0) {
    throw new Error("git reported no first commit for this repository.");
  }
  return {
    commits: requiredCount(outputs.commitCount, "The commit count"),
    mergedPullRequests: requiredCount(
      outputs.mergedPullRequests,
      "The merged pull request count",
    ),
    firstCommitDate,
    contributors: countLines(outputs.contributors),
  };
}
