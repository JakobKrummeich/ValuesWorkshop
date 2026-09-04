import { z } from "zod";

export interface GateConfigurationSources {
  eslintConfig: string;
  jestConfig: string;
  cyclomaticComplexityAnalyzer: string;
  fileLengthAnalyzer: string;
  duplicationConfig: string;
  backendCoverageScript: string;
}

export interface EnforcedLimits {
  frontendComplexity: number;
  frontendProductionFileLines: number;
  frontendTestFileLines: number;
  frontendLineCoverage: number;
  backendComplexity: number;
  backendProductionFileLines: number;
  backendTestFileLines: number;
  backendLineCoverage: number;
  duplicationPercentage: number;
  duplicationMinimumTokens: number;
}

const duplicationConfigSchema = z.object({
  threshold: z.number(),
  minTokens: z.number(),
});

function readSingleNumber(
  source: string,
  pattern: RegExp,
  description: string,
): number {
  const match = pattern.exec(source);
  if (!match) {
    throw new Error(
      `${description} could not be read from the gate configuration, so the enforced limit is unknown.`,
    );
  }
  return Number(match[1]);
}

export function parseFrontendFileLineLimits(eslintConfig: string): {
  production: number;
  test: number;
} {
  const limits = [...eslintConfig.matchAll(/"max-lines"[\s\S]*?max:\s*(\d+)/g)]
    .map((match) => Number(match[1]))
    .sort((left, right) => left - right);
  if (limits.length !== 2) {
    throw new Error(
      `The eslint configuration declares ${limits.length} max-lines limits; a production and a test limit are expected.`,
    );
  }
  return { production: limits[0], test: limits[1] };
}

export function readEnforcedLimits(
  sources: GateConfigurationSources,
): EnforcedLimits {
  const frontendFileLines = parseFrontendFileLineLimits(sources.eslintConfig);
  const duplication = duplicationConfigSchema.parse(
    JSON.parse(sources.duplicationConfig),
  );
  return {
    frontendComplexity: readSingleNumber(
      sources.eslintConfig,
      /complexity:\s*\["error",\s*(\d+)\]/,
      "The eslint complexity cap",
    ),
    frontendProductionFileLines: frontendFileLines.production,
    frontendTestFileLines: frontendFileLines.test,
    frontendLineCoverage: readSingleNumber(
      sources.jestConfig,
      /coverageThreshold:[\s\S]*?lines:\s*(\d+)/,
      "The jest line coverage threshold",
    ),
    backendComplexity: readSingleNumber(
      sources.cyclomaticComplexityAnalyzer,
      /Threshold\s*=\s*(\d+)/,
      "The VW1001 complexity cap",
    ),
    backendProductionFileLines: readSingleNumber(
      sources.fileLengthAnalyzer,
      /MaxLines\s*=\s*(\d+)/,
      "The VW1002 file length cap",
    ),
    backendTestFileLines: readSingleNumber(
      sources.fileLengthAnalyzer,
      /MaxLinesTests\s*=\s*(\d+)/,
      "The VW1002 file length cap for tests",
    ),
    backendLineCoverage: readSingleNumber(
      sources.backendCoverageScript,
      /THRESHOLD=(\d+)/,
      "The backend line coverage threshold",
    ),
    duplicationPercentage: duplication.threshold,
    duplicationMinimumTokens: duplication.minTokens,
  };
}
