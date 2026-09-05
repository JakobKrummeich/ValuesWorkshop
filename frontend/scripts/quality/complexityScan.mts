import { z } from "zod";
import { toRepositoryPath } from "./qualityReport.mts";

export interface ComplexityBucket {
  complexity: number;
  functions: number;
}

export interface ComplexFunction {
  path: string;
  line: number;
  name: string;
  complexity: number;
}

export interface ComplexityMetrics {
  functions: number;
  maximum: number;
  mean: number;
  aboveCap: number;
  distribution: ComplexityBucket[];
  mostComplex: ComplexFunction[];
}

const eslintReportSchema = z.array(
  z.object({
    filePath: z.string(),
    messages: z.array(
      z.object({
        ruleId: z.string().nullable(),
        message: z.string(),
        line: z.number().optional(),
      }),
    ),
  }),
);

const complexityMessage = /^(.*) has a complexity of (\d+)\./;

const mostComplexFunctionsReported = 5;

export function parseEslintComplexityReport(
  reportJson: string,
  repositoryRoot: string,
): ComplexFunction[] {
  const report = eslintReportSchema.parse(JSON.parse(reportJson));
  const measured = report.flatMap((file) =>
    file.messages
      .filter((message) => message.ruleId === "complexity")
      .map((message) => {
        const match = complexityMessage.exec(message.message);
        if (!match) {
          throw new Error(
            `An eslint complexity finding did not report a complexity: "${message.message}".`,
          );
        }
        return {
          path: toRepositoryPath(file.filePath, repositoryRoot),
          line: message.line ?? 0,
          name: match[1],
          complexity: Number(match[2]),
        };
      }),
  );
  if (measured.length === 0) {
    throw new Error(
      "The eslint report holds no complexity findings, so no function was measured.",
    );
  }
  return measured;
}

export function summarizeComplexity(
  measured: readonly ComplexFunction[],
  cap: number,
): ComplexityMetrics {
  const total = measured.reduce((sum, entry) => sum + entry.complexity, 0);
  const byComplexity = new Map<number, number>();
  for (const entry of measured) {
    byComplexity.set(
      entry.complexity,
      (byComplexity.get(entry.complexity) ?? 0) + 1,
    );
  }
  return {
    functions: measured.length,
    maximum: Math.max(...measured.map((entry) => entry.complexity)),
    mean: Math.round((total / measured.length) * 100) / 100,
    aboveCap: measured.filter((entry) => entry.complexity > cap).length,
    distribution: [...byComplexity.entries()]
      .map(([complexity, functions]) => ({ complexity, functions }))
      .sort((left, right) => left.complexity - right.complexity),
    mostComplex: [...measured]
      .sort(
        (left, right) =>
          right.complexity - left.complexity ||
          left.path.localeCompare(right.path) ||
          left.line - right.line,
      )
      .slice(0, mostComplexFunctionsReported),
  };
}
