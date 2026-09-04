import { z } from "zod";

export interface FrontendTestCounts {
  suites: number;
  tests: number;
  passed: number;
  failed: number;
  skipped: number;
  testsByFile: ReadonlyMap<string, number>;
}

export interface BackendAssemblyTests {
  assembly: string;
  passed: number;
  failed: number;
  skipped: number;
  total: number;
}

export interface BackendTestCounts {
  assemblies: BackendAssemblyTests[];
  tests: number;
  passed: number;
  failed: number;
  skipped: number;
}

export interface EndToEndTestCounts {
  tests: number;
  files: number;
}

const jestReportSchema = z.object({
  numTotalTestSuites: z.number(),
  numTotalTests: z.number(),
  numPassedTests: z.number(),
  numFailedTests: z.number(),
  numPendingTests: z.number(),
  numTodoTests: z.number(),
  testResults: z.array(
    z.object({
      name: z.string(),
      assertionResults: z.array(z.object({ status: z.string() })),
    }),
  ),
});

const backendAssemblyLine =
  /^(?:Passed|Failed|Skipped)!\s+-\s+Failed:\s+(\d+), Passed:\s+(\d+), Skipped:\s+(\d+), Total:\s+(\d+),.*?-\s+(\S+\.dll)/gm;

const endToEndTotalLine = /^Total:\s+(\d+)\s+tests?\s+in\s+(\d+)\s+files?/m;

export function parseJestReport(reportJson: string): FrontendTestCounts {
  const report = jestReportSchema.parse(JSON.parse(reportJson));
  return {
    suites: report.numTotalTestSuites,
    tests: report.numTotalTests,
    passed: report.numPassedTests,
    failed: report.numFailedTests,
    skipped: report.numPendingTests + report.numTodoTests,
    testsByFile: new Map(
      report.testResults.map((suite) => [
        suite.name,
        suite.assertionResults.length,
      ]),
    ),
  };
}

export function testsInFile(
  counts: FrontendTestCounts,
  pathSuffix: string,
): number {
  const matches = [...counts.testsByFile.entries()].filter(([path]) =>
    path.endsWith(pathSuffix),
  );
  if (matches.length !== 1) {
    throw new Error(
      `The jest report holds ${matches.length} test files ending in ${pathSuffix}; exactly one is expected.`,
    );
  }
  return matches[0][1];
}

export function parseBackendTestOutput(output: string): BackendTestCounts {
  const assemblies = [...output.matchAll(backendAssemblyLine)].map((match) => ({
    assembly: match[5],
    failed: Number(match[1]),
    passed: Number(match[2]),
    skipped: Number(match[3]),
    total: Number(match[4]),
  }));
  if (assemblies.length === 0) {
    throw new Error(
      "The backend test output holds no per-assembly result line, so no test count could be read.",
    );
  }
  const sum = (pick: (assembly: BackendAssemblyTests) => number) =>
    assemblies.reduce((total, assembly) => total + pick(assembly), 0);
  return {
    assemblies: [...assemblies].sort((left, right) =>
      left.assembly.localeCompare(right.assembly),
    ),
    tests: sum((assembly) => assembly.total),
    passed: sum((assembly) => assembly.passed),
    failed: sum((assembly) => assembly.failed),
    skipped: sum((assembly) => assembly.skipped),
  };
}

export function parseEndToEndTestList(output: string): EndToEndTestCounts {
  const match = endToEndTotalLine.exec(output);
  if (!match) {
    throw new Error(
      "The Playwright listing holds no `Total: N tests in M files` line, so no test count could be read.",
    );
  }
  return { tests: Number(match[1]), files: Number(match[2]) };
}
