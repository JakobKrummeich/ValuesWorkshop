import type { ComplexFunction } from "./complexityScan.mts";
import { toRepositoryPath } from "./qualityReport.mts";

export const backendComplexityBuildArguments = [
  "build",
  "backend/ValuesWorkshop.All.sln",
  "--no-incremental",
  "-p:ReportCyclomaticComplexity=true",
];

const measurementWarning =
  /^(.+\.cs)\((\d+),\d+\): warning VW1003: '(.+)' has cyclomatic complexity (\d+)/gm;

export function parseBackendComplexityReport(
  buildOutput: string,
  repositoryRoot: string,
): ComplexFunction[] {
  const byMember = new Map<string, ComplexFunction>();
  for (const [, path, line, name, complexity] of buildOutput.matchAll(
    measurementWarning,
  )) {
    byMember.set(`${path}:${line}:${name}`, {
      path: toRepositoryPath(path, repositoryRoot),
      line: Number(line),
      name,
      complexity: Number(complexity),
    });
  }
  if (byMember.size === 0) {
    throw new Error(
      "The backend build reported no VW1003 measurement, so no member's complexity was read; the build must run with ReportCyclomaticComplexity=true.",
    );
  }
  return [...byMember.values()].sort(
    (left, right) =>
      left.path.localeCompare(right.path) ||
      left.line - right.line ||
      left.name.localeCompare(right.name),
  );
}
