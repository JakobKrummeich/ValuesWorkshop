import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  backendComplexityBuildArguments,
  parseBackendComplexityReport,
} from "../quality/backendComplexityScan.mts";

const repositoryRoot = "/home/dev/ValuesWorkshop";
const buildOutput = readFileSync(
  join(__dirname, "fixtures/quality/backendComplexityBuild.txt"),
  "utf8",
);

describe("backendComplexityBuildArguments", () => {
  it("rebuilds every project with the measurement promoted to a warning", () => {
    expect(backendComplexityBuildArguments).toEqual([
      "build",
      "backend/ValuesWorkshop.All.sln",
      "--no-incremental",
      "-p:ReportCyclomaticComplexity=true",
    ]);
  });
});

describe("parseBackendComplexityReport", () => {
  const measured = parseBackendComplexityReport(buildOutput, repositoryRoot);

  it("reads every member once, although MSBuild repeats each warning in its summary", () => {
    expect(measured).toHaveLength(11);
  });

  it("names the member with its repository path, line and complexity", () => {
    expect(measured).toContainEqual({
      path: "backend/Domain/QuizProgress.cs",
      line: 77,
      name: "ChooseAnswer",
      complexity: 6,
    });
    expect(measured).toContainEqual({
      path: "backend/Domain/QuizProgress.cs",
      line: 45,
      name: "IsQuizComplete",
      complexity: 3,
    });
  });

  it("orders the members by path and line so the report is stable", () => {
    expect(
      measured.slice(0, 4).map((entry) => `${entry.path}:${entry.line}`),
    ).toEqual([
      "backend/Adapters.Web/SessionCreationEndpoint.cs:59",
      "backend/Domain.Tests/QuizProgressTests.cs:9",
      "backend/Domain.Tests/QuizProgressTests.cs:15",
      "backend/Domain.Tests/QuizProgressTests.cs:23",
    ]);
  });

  it("refuses a build that measured nothing, because the analyzer was not promoted", () => {
    expect(() =>
      parseBackendComplexityReport(
        "Build succeeded.\n    0 Warning(s)\n    0 Error(s)\n",
        repositoryRoot,
      ),
    ).toThrow(
      "The backend build reported no VW1003 measurement, so no member's complexity was read; the build must run with ReportCyclomaticComplexity=true.",
    );
  });
});
