import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  parseEslintComplexityReport,
  summarizeComplexity,
  type ComplexFunction,
} from "../quality/complexityScan.mts";

const repositoryRoot = "/home/dev/ValuesWorkshop";
const fixture = (name: string) =>
  readFileSync(join(__dirname, "fixtures/quality", name), "utf8");

describe("parseEslintComplexityReport", () => {
  const measured = parseEslintComplexityReport(
    fixture("eslintComplexityReport.json"),
    repositoryRoot,
  );

  it("reads every function eslint reported, under its repository path", () => {
    expect(measured).toHaveLength(8);
    expect(measured).toContainEqual({
      path: "frontend/scripts/generatePhasesModule.mts",
      line: 55,
      name: "Function 'runPhaseEnumCodegen'",
      complexity: 6,
    });
  });

  it("refuses a report in which no function was measured", () => {
    expect(() =>
      parseEslintComplexityReport(
        '[{"filePath":"a.ts","messages":[]}]',
        repositoryRoot,
      ),
    ).toThrow("holds no complexity findings");
  });

  it("refuses a complexity finding without a complexity in it", () => {
    expect(() =>
      parseEslintComplexityReport(
        '[{"filePath":"a.ts","messages":[{"ruleId":"complexity","message":"too complex"}]}]',
        repositoryRoot,
      ),
    ).toThrow("did not report a complexity");
  });
});

describe("summarizeComplexity", () => {
  const measured: ComplexFunction[] = [
    {
      path: "backend/Domain/Session.cs",
      line: 40,
      name: "Advance",
      complexity: 6,
    },
    {
      path: "backend/Domain/Session.cs",
      line: 12,
      name: "Open",
      complexity: 1,
    },
    { path: "backend/Domain/Group.cs", line: 9, name: "Join", complexity: 8 },
    { path: "backend/Domain/Group.cs", line: 30, name: "Leave", complexity: 2 },
    { path: "backend/Domain/Group.cs", line: 51, name: "Size", complexity: 1 },
    { path: "backend/Domain/Quiz.cs", line: 5, name: "Answer", complexity: 6 },
  ];
  const metrics = summarizeComplexity(measured, 7);

  it("counts, tops and averages what was measured", () => {
    expect(metrics.functions).toBe(6);
    expect(metrics.maximum).toBe(8);
    expect(metrics.mean).toBe(4);
  });

  it("counts the functions above the enforced cap", () => {
    expect(metrics.aboveCap).toBe(1);
    expect(summarizeComplexity(measured, 8).aboveCap).toBe(0);
  });

  it("counts how many functions sit at each complexity", () => {
    expect(metrics.distribution).toEqual([
      { complexity: 1, functions: 2 },
      { complexity: 2, functions: 1 },
      { complexity: 6, functions: 2 },
      { complexity: 8, functions: 1 },
    ]);
  });

  it("names the five most complex functions, ties broken by path and line", () => {
    expect(
      metrics.mostComplex.map((entry) => `${entry.name} ${entry.complexity}`),
    ).toEqual(["Join 8", "Answer 6", "Advance 6", "Leave 2", "Size 1"]);
  });

  it("rounds the mean to two decimals", () => {
    expect(summarizeComplexity(measured.slice(0, 3), 7).mean).toBe(5);
    expect(summarizeComplexity(measured.slice(3), 7).mean).toBe(3);
    expect(summarizeComplexity(measured.slice(0, 6), 7).mean).toBe(4);
    expect(summarizeComplexity(measured.slice(1, 4), 7).mean).toBe(3.67);
  });
});
