import { z } from "zod";

export interface DuplicationClone {
  format: string;
  lines: number;
  tokens: number;
  firstPath: string;
  secondPath: string;
}

export interface DuplicationMetrics {
  sources: number;
  lines: number;
  tokens: number;
  clones: number;
  duplicatedLines: number;
  duplicatedTokens: number;
  duplicatedLinePercentage: number;
  duplicatedTokenPercentage: number;
  largestClones: DuplicationClone[];
}

const cloneFileSchema = z.object({ name: z.string() });

const duplicationReportSchema = z.object({
  statistics: z.object({
    total: z.object({
      sources: z.number(),
      lines: z.number(),
      tokens: z.number(),
      clones: z.number(),
      duplicatedLines: z.number(),
      duplicatedTokens: z.number(),
      percentage: z.number(),
      percentageTokens: z.number(),
    }),
  }),
  duplicates: z.array(
    z.object({
      format: z.string(),
      lines: z.number(),
      tokens: z.number(),
      firstFile: cloneFileSchema,
      secondFile: cloneFileSchema,
    }),
  ),
});

const largestClonesReported = 5;

export function parseDuplicationReport(reportJson: string): DuplicationMetrics {
  const report = duplicationReportSchema.parse(JSON.parse(reportJson));
  const total = report.statistics.total;
  return {
    sources: total.sources,
    lines: total.lines,
    tokens: total.tokens,
    clones: total.clones,
    duplicatedLines: total.duplicatedLines,
    duplicatedTokens: total.duplicatedTokens,
    duplicatedLinePercentage: total.percentage,
    duplicatedTokenPercentage: total.percentageTokens,
    largestClones: [...report.duplicates]
      .sort(
        (left, right) =>
          right.tokens - left.tokens ||
          left.firstFile.name.localeCompare(right.firstFile.name),
      )
      .slice(0, largestClonesReported)
      .map((clone) => ({
        format: clone.format,
        lines: clone.lines,
        tokens: clone.tokens,
        firstPath: clone.firstFile.name,
        secondPath: clone.secondFile.name,
      })),
  };
}
