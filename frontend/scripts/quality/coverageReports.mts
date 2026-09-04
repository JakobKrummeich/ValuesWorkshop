import { z } from "zod";

export interface CoverageMetrics {
  linePercentage: number;
  coveredLines: number;
  coverableLines: number;
  branchPercentage: number;
}

const coverageCountsSchema = z.object({
  total: z.number(),
  covered: z.number(),
  pct: z.number(),
});

const frontendCoverageSummarySchema = z.object({
  total: z.object({
    lines: coverageCountsSchema,
    branches: coverageCountsSchema,
  }),
});

export function parseFrontendCoverageSummary(
  summaryJson: string,
): CoverageMetrics {
  const summary = frontendCoverageSummarySchema.parse(JSON.parse(summaryJson));
  return {
    linePercentage: summary.total.lines.pct,
    coveredLines: summary.total.lines.covered,
    coverableLines: summary.total.lines.total,
    branchPercentage: summary.total.branches.pct,
  };
}

function readLabelledNumber(summaryText: string, label: string): number {
  const match = new RegExp(`^\\s*${label}:\\s*([0-9.]+)`, "m").exec(
    summaryText,
  );
  if (!match) {
    throw new Error(
      `The backend coverage summary holds no \`${label}\` line, so that number could not be read.`,
    );
  }
  return Number(match[1]);
}

export function parseBackendCoverageSummary(
  summaryText: string,
): CoverageMetrics {
  return {
    linePercentage: readLabelledNumber(summaryText, "Line coverage"),
    coveredLines: readLabelledNumber(summaryText, "Covered lines"),
    coverableLines: readLabelledNumber(summaryText, "Coverable lines"),
    branchPercentage: readLabelledNumber(summaryText, "Branch coverage"),
  };
}
