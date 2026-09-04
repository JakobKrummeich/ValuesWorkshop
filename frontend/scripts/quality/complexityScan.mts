import { z } from "zod";

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
  otherRuleFindings: number;
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
): ComplexityMetrics {
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
          path: file.filePath,
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
  const otherRuleFindings = report.reduce(
    (total, file) =>
      total +
      file.messages.filter((message) => message.ruleId !== "complexity").length,
    0,
  );
  return summarizeComplexity(measured, otherRuleFindings);
}

function summarizeComplexity(
  measured: ComplexFunction[],
  otherRuleFindings: number,
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
    otherRuleFindings,
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
