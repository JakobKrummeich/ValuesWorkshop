import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  parseBackendTestOutput,
  parseEndToEndTestList,
  parseJestReport,
  testsInFile,
} from "../quality/testCounts.mts";

const fixture = (name: string) =>
  readFileSync(join(__dirname, "fixtures/quality", name), "utf8");

describe("parseJestReport", () => {
  const counts = parseJestReport(fixture("jestReport.json"));

  it("reads the suite and test totals jest reported", () => {
    expect(counts).toMatchObject({
      suites: 167,
      tests: 1063,
      passed: 1063,
      failed: 0,
      skipped: 0,
    });
  });

  it("keeps the test count of every reported file", () => {
    expect(testsInFile(counts, "wireContract.test.ts")).toBe(3);
  });

  it("refuses a file suffix that does not name exactly one suite", () => {
    expect(() => testsInFile(counts, "missing.test.ts")).toThrow(
      "holds 0 test files ending in missing.test.ts",
    );
  });

  it("refuses output that is not a jest report", () => {
    expect(() => parseJestReport("{}")).toThrow();
  });
});

describe("parseBackendTestOutput", () => {
  const counts = parseBackendTestOutput(fixture("backendTestOutput.txt"));

  it("adds up every test assembly dotnet reported", () => {
    expect(counts).toMatchObject({
      tests: 901,
      passed: 901,
      failed: 0,
      skipped: 0,
    });
    expect(counts.assemblies).toHaveLength(4);
  });

  it("orders the assemblies so two runs report them the same way", () => {
    expect(counts.assemblies.map((assembly) => assembly.assembly)).toEqual([
      "ValuesWorkshop.Adapters.Tests.dll",
      "ValuesWorkshop.Application.Tests.dll",
      "ValuesWorkshop.Domain.Tests.dll",
      "ValuesWorkshop.Host.Tests.dll",
    ]);
  });

  it("refuses output without a per-assembly result line", () => {
    expect(() => parseBackendTestOutput("Build succeeded.")).toThrow(
      "no per-assembly result line",
    );
  });
});

describe("parseEndToEndTestList", () => {
  it("reads the total Playwright printed", () => {
    expect(parseEndToEndTestList(fixture("playwrightTestList.txt"))).toEqual({
      tests: 93,
      files: 9,
    });
  });

  it("refuses a listing without a total", () => {
    expect(() => parseEndToEndTestList("Listing tests:")).toThrow(
      "no `Total: N tests in M files` line",
    );
  });
});
