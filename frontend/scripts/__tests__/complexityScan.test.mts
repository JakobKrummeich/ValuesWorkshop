import { readFileSync } from "node:fs";
import { join } from "node:path";
import { parseEslintComplexityReport } from "../quality/complexityScan.mts";

const fixture = (name: string) =>
  readFileSync(join(__dirname, "fixtures/quality", name), "utf8");

describe("parseEslintComplexityReport", () => {
  const metrics = parseEslintComplexityReport(
    fixture("eslintComplexityReport.json"),
  );

  it("measures every function eslint reported", () => {
    expect(metrics.functions).toBe(8);
    expect(metrics.maximum).toBe(6);
    expect(metrics.mean).toBe(2.75);
    expect(metrics.otherRuleFindings).toBe(0);
  });

  it("counts how many functions sit at each complexity", () => {
    expect(metrics.distribution).toEqual([
      { complexity: 1, functions: 3 },
      { complexity: 2, functions: 2 },
      { complexity: 3, functions: 1 },
      { complexity: 6, functions: 2 },
    ]);
  });

  it("names the most complex functions with their file and line", () => {
    expect(metrics.mostComplex[0]).toEqual({
      path: "/home/dev/ValuesWorkshop/frontend/scripts/generatePhasesModule.mts",
      line: 55,
      name: "Function 'runPhaseEnumCodegen'",
      complexity: 6,
    });
    expect(metrics.mostComplex).toHaveLength(5);
  });

  it("refuses a report in which no function was measured", () => {
    expect(() =>
      parseEslintComplexityReport('[{"filePath":"a.ts","messages":[]}]'),
    ).toThrow("holds no complexity findings");
  });

  it("refuses a complexity finding without a complexity in it", () => {
    expect(() =>
      parseEslintComplexityReport(
        '[{"filePath":"a.ts","messages":[{"ruleId":"complexity","message":"too complex"}]}]',
      ),
    ).toThrow("did not report a complexity");
  });
});
