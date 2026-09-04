import { renderMetricsMarkdown } from "../quality/metricsMarkdown.mts";
import type { QualityReport } from "../quality/qualityReport.mts";
import {
  RepositoryArea,
  RepositorySide,
  SourceKind,
} from "../quality/sizeScan.mts";

const report: QualityReport = {
  generatedAt: "2026-09-04T15:00:00.000Z",
  commit: {
    sha: "fd3cb1bee884e8679c0de08042e0da7c724593c0",
    shortSha: "fd3cb1b",
    committedAt: "2026-09-04T14:03:27+00:00",
    subject: "Task 30 is specified and sliced",
  },
  enforcedLimits: {
    frontendComplexity: 7,
    frontendProductionFileLines: 300,
    frontendTestFileLines: 600,
    frontendLineCoverage: 80,
    backendComplexity: 7,
    backendProductionFileLines: 300,
    backendTestFileLines: 600,
    backendLineCoverage: 80,
    duplicationPercentage: 2,
    duplicationMinimumTokens: 50,
  },
  size: {
    commands: ["git ls-files"],
    files: 1071,
    productionLines: 33000,
    testLines: 38000,
    totalLines: 71000,
    areas: [
      {
        area: RepositoryArea.Backend,
        files: 349,
        productionLines: 12000,
        testLines: 14000,
        totalLines: 26000,
      },
    ],
    filesByExtension: [{ extension: "cs", files: 321 }],
    longestFiles: [],
  },
  tests: {
    commands: ["pnpm --dir frontend test"],
    totalTests: 2057,
    frontend: {
      suites: 167,
      tests: 1063,
      passed: 1063,
      failed: 0,
      skipped: 0,
      lineCoverage: 97.53,
      branchCoverage: 93.6,
      coveredLines: 2257,
      coverableLines: 2314,
    },
    backend: {
      assemblies: [
        {
          assembly: "ValuesWorkshop.Domain.Tests.dll",
          passed: 308,
          failed: 0,
          skipped: 0,
          total: 308,
        },
      ],
      tests: 901,
      passed: 901,
      failed: 0,
      skipped: 0,
      lineCoverage: 98.7,
      branchCoverage: 93.9,
      coveredLines: 9693,
      coverableLines: 9817,
    },
    endToEnd: { tests: 93, files: 9 },
  },
  complexity: {
    commands: ["npx eslint --format json"],
    frontend: {
      functions: 2906,
      maximum: 7,
      mean: 1.18,
      otherRuleFindings: 0,
      distribution: [{ complexity: 7, functions: 2 }],
      mostComplex: [
        {
          path: "frontend/src/app/facilitator/advanceGuard.ts",
          line: 16,
          name: "Function 'advanceGuardMessageOf'",
          complexity: 7,
        },
      ],
    },
    backendAnalyzerDiagnostics: 0,
    longestFiles: [
      {
        side: RepositorySide.Backend,
        kind: SourceKind.Production,
        path: "backend/Domain/Session.cs",
        lineCount: 289,
      },
      {
        side: RepositorySide.Frontend,
        kind: SourceKind.Test,
        path: "frontend/src/app/__tests__/page.test.tsx",
        lineCount: 480,
      },
    ],
  },
  duplication: {
    commands: ["pnpm -w jscpd --reporters json"],
    sources: 603,
    lines: 24449,
    tokens: 192120,
    clones: 3,
    duplicatedLines: 28,
    duplicatedTokens: 257,
    duplicatedLinePercentage: 0.11,
    duplicatedTokenPercentage: 0.13,
    largestClones: [],
  },
  architecture: {
    commands: ["npx depcruise src"],
    frontend: {
      modules: 516,
      dependencies: 1829,
      rules: 14,
      violations: 0,
      circularDependencies: 0,
    },
    folderInstability: [
      {
        folder: "src/domain",
        afferentCouplings: 505,
        efferentCouplings: 21,
        instability: 0.04,
      },
    ],
    backendRules: 8,
    backendRuleNames: ["Application depends only on Domain"],
  },
  designSystem: {
    commands: ["git ls-files"],
    customProperties: 164,
    tokenFiles: [
      { path: "frontend/src/app/tokens.css", customProperties: 120 },
    ],
    cssModules: 88,
    contrastAssertions: 69,
  },
  contract: {
    commands: ["git ls-files"],
    fixtures: 41,
    fixtureGroups: [{ role: "facilitator", fixtures: 13 }],
    frontendAssertions: 41,
    backendTestMethods: 2,
  },
  security: {
    commands: ["pnpm --dir frontend audit:check"],
    frontend: { exitCode: 0, findings: 0, summary: "No known vulnerabilities" },
    backend: { exitCode: 0, findings: 0, summary: "No vulnerable packages" },
  },
  supplyChain: {
    commands: ["pnpm sbom", "pnpm advisories:scan"],
    billsOfMaterials: [
      {
        path: "docs/quality/sbom/frontend.cdx.json",
        describes: "frontend runtime dependencies of the pnpm workspace",
        components: 32,
      },
      {
        path: "docs/quality/sbom/backend.cdx.json",
        describes: "backend runtime packages of the .NET solution",
        components: 67,
      },
    ],
    advisories: { exitCode: 0, findings: 0, summary: "No known advisories" },
  },
  mutation: {
    frontend: {
      tool: "StrykerJS 10.0.0",
      command: "pnpm mutation:frontend",
      commit: "fd3cb1bee884e8679c0de08042e0da7c724593c0",
      measuredAt: "2026-09-04T12:00:00.000Z",
      score: 81.25,
      killed: 1300,
      survived: 280,
      timeout: 12,
      noCoverage: 8,
    },
    backend: {
      tool: "Stryker.NET 4.16.0",
      command: "pnpm mutation:backend",
      commit: "fd3cb1bee884e8679c0de08042e0da7c724593c0",
      measuredAt: "2026-09-04T13:00:00.000Z",
      score: 75.41,
      killed: 46,
      survived: 13,
      timeout: 0,
      noCoverage: 2,
    },
  },
  process: {
    commands: ["git rev-list --count HEAD"],
    commits: 800,
    mergedPullRequests: 66,
    firstCommitDate: "2026-07-19T17:25:51+00:00",
    contributors: 4,
  },
};

describe("renderMetricsMarkdown", () => {
  const markdown = renderMetricsMarkdown(report);

  it("stamps the commit, its date and the moment of the run", () => {
    expect(markdown).toContain("`fd3cb1b` — Task 30 is specified and sliced");
    expect(markdown).toContain("2026-09-04T14:03:27+00:00");
    expect(markdown).toContain("2026-09-04T15:00:00.000Z");
  });

  it("opens every group with the command that produced its numbers", () => {
    const groups = markdown
      .split("\n")
      .filter((line) => line.startsWith("## "));
    expect(groups).toEqual([
      "## Size",
      "## Tests and coverage",
      "## Complexity",
      "## Duplication",
      "## Architecture",
      "## Design system",
      "## Wire contract",
      "## Mutation testing",
      "## Security",
      "## Supply chain",
      "## Process",
    ]);
    expect(markdown.split("Produced by:")).toHaveLength(groups.length + 1);
  });

  it("puts every measured number next to the limit that is enforced", () => {
    expect(markdown).toContain("at least 80%");
    expect(markdown).toContain("at most 7 (analyzer VW1001)");
    expect(markdown).toContain("at most 2%");
  });

  it("names the longest file on each side against the cap it lives under", () => {
    expect(markdown).toContain(
      "`backend/Domain/Session.cs` | 289 | at most 300",
    );
    expect(markdown).toContain(
      "`frontend/src/app/__tests__/page.test.tsx` | 480 | at most 600",
    );
  });

  it("groups thousands so the totals stay readable", () => {
    expect(markdown).toContain("2,057");
    expect(markdown).toContain("192,120");
  });

  it("reports the mutation score against the commit it was measured at", () => {
    expect(markdown).toContain("| frontend | StrykerJS 10.0.0 | 81.25% |");
    expect(markdown).toContain("| backend | Stryker.NET 4.16.0 | 75.41% |");
    expect(markdown).toContain(
      "The frontend score was measured at `fd3cb1b`, the commit this report describes.",
    );
  });

  it("says plainly that a mutation score describes another commit", () => {
    const stale = renderMetricsMarkdown({
      ...report,
      mutation: {
        ...report.mutation,
        backend: {
          ...report.mutation.backend!,
          commit: "9b1c0f4a2d6e8c0b4a2d6e8c0b4a2d6e8c0b4a2d",
        },
      },
    });
    expect(stale).toContain(
      "The backend score was measured at `9b1c0f4`, not at `fd3cb1b` — the commit this report describes — so it does not describe the code as it stands.",
    );
  });

  it("says plainly that a side was never measured", () => {
    const unmeasured = renderMetricsMarkdown({ ...report, mutation: {} });
    expect(unmeasured).toContain(
      "No frontend run is recorded, so the frontend score is absent rather than zero.",
    );
    expect(unmeasured).toContain(
      "No backend run is recorded, so the backend score is absent rather than zero.",
    );
    expect(unmeasured).toContain("- `pnpm mutation:frontend`");
    expect(unmeasured).not.toContain("| mutation score |");
  });

  it("counts the components of every bill of materials", () => {
    expect(markdown).toContain(
      "| `docs/quality/sbom/frontend.cdx.json` | frontend runtime dependencies of the pnpm workspace | 32 |",
    );
    expect(markdown).toContain(
      "osv-scanner over `pnpm-lock.yaml` and both bills of materials | 0 | 0 | No known advisories |",
    );
  });

  it("ends in a single newline", () => {
    expect(markdown.endsWith("\n")).toBe(true);
    expect(markdown.endsWith("\n\n")).toBe(false);
  });
});
