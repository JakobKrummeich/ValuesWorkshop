import { noKnownVulnerabilitiesReport } from "../auditDependencies.mts";

export interface VulnerabilityScanResult {
  exitCode: number;
  findings: number;
  summary: string;
}

const backendCleanProject = /has no vulnerable packages/g;
const backendVulnerablePackage =
  /^\s*>\s+\S+\s+\S+\s+\S+\s+(Critical|High|Moderate|Low)\b/gm;

function countAdvisories(output: string): number {
  const start = output.indexOf("{");
  if (start < 0) {
    throw new Error(
      `The frontend vulnerability scan produced neither a clean report nor an advisory report:\n${output}`,
    );
  }
  const parsed: unknown = JSON.parse(output.slice(start));
  const advisories =
    typeof parsed === "object" && parsed !== null && "advisories" in parsed
      ? parsed.advisories
      : {};
  return Object.keys(advisories as Record<string, unknown>).length;
}

export function summarizeFrontendVulnerabilityScan(
  exitCode: number,
  output: string,
): VulnerabilityScanResult {
  if (output.includes(noKnownVulnerabilitiesReport)) {
    return { exitCode, findings: 0, summary: noKnownVulnerabilitiesReport };
  }
  const findings = countAdvisories(output);
  return {
    exitCode,
    findings,
    summary: `${findings} advisories of high severity or above`,
  };
}

export function summarizeBackendVulnerabilityScan(
  exitCode: number,
  output: string,
): VulnerabilityScanResult {
  const cleanProjects = [...output.matchAll(backendCleanProject)].length;
  const findings = [...output.matchAll(backendVulnerablePackage)].length;
  if (cleanProjects === 0 && findings === 0) {
    throw new Error(
      `The backend vulnerability scan listed no project at all:\n${output}`,
    );
  }
  return {
    exitCode,
    findings,
    summary:
      findings === 0
        ? `No vulnerable packages across ${cleanProjects} scanned projects`
        : `${findings} vulnerable packages of Low severity or above`,
  };
}
