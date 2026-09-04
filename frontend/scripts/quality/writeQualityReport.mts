import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import type { RepositoryLocations } from "./collectionContext.mts";
import { collectQualityMetrics } from "./collectQualityMetrics.mts";
import { renderMetricsMarkdown } from "./metricsMarkdown.mts";
import {
  renderQualityReportJson,
  resolveGeneratedAt,
  type QualityReport,
} from "./qualityReport.mts";
import { generateStructuralDiagrams } from "./structuralDiagrams.mts";

export const metricsJsonPath = "docs/quality/metrics.json";
export const metricsMarkdownPath = "docs/quality/metrics.md";

export interface QualityReportOutcome {
  exitCode: number;
  report: string;
}

function readIfPresent(path: string): string | undefined {
  return existsSync(path) ? readFileSync(path, "utf8") : undefined;
}

function write(repositoryRoot: string, path: string, content: string): void {
  const file = resolve(repositoryRoot, path);
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, content);
}

function writeDiagrams(locations: RepositoryLocations): string[] {
  const diagrams = generateStructuralDiagrams(locations);
  for (const diagram of diagrams) {
    write(locations.repositoryRoot, diagram.path, diagram.mermaid);
  }
  return diagrams.map((diagram) => diagram.path);
}

function measure(locations: RepositoryLocations, now: string): QualityReport {
  const temporaryDirectory = mkdtempSync(join(tmpdir(), "quality-report-"));
  try {
    const collected = collectQualityMetrics({
      ...locations,
      temporaryDirectory,
    });
    return {
      generatedAt: resolveGeneratedAt(
        readIfPresent(resolve(locations.repositoryRoot, metricsJsonPath)),
        collected.commit.sha,
        now,
      ),
      ...collected,
    };
  } finally {
    rmSync(temporaryDirectory, { recursive: true, force: true });
  }
}

export function writeQualityReport(
  repositoryRoot: string,
  now: string,
): QualityReportOutcome {
  try {
    const locations = {
      repositoryRoot,
      frontendDirectory: resolve(repositoryRoot, "frontend"),
    };
    const diagrams = writeDiagrams(locations);
    const report = measure(locations, now);
    write(repositoryRoot, metricsJsonPath, renderQualityReportJson(report));
    write(repositoryRoot, metricsMarkdownPath, renderMetricsMarkdown(report));
    return {
      exitCode: 0,
      report: [
        `Measured ${report.commit.shortSha} — ${report.commit.subject}`,
        `Wrote ${[metricsJsonPath, metricsMarkdownPath, ...diagrams].join(", ")}`,
      ].join("\n"),
    };
  } catch (error) {
    return {
      exitCode: 1,
      report: [
        "The quality report was not written because a measurement failed:",
        error instanceof Error ? error.message : String(error),
      ].join("\n"),
    };
  }
}

function isInvokedAsScript(): boolean {
  return process.argv[1]?.endsWith("writeQualityReport.mts") ?? false;
}

if (isInvokedAsScript()) {
  const outcome = writeQualityReport(
    resolve(process.cwd(), ".."),
    new Date().toISOString(),
  );
  const stream = outcome.exitCode === 0 ? process.stdout : process.stderr;
  stream.write(`${outcome.report}\n`);
  process.exit(outcome.exitCode);
}
