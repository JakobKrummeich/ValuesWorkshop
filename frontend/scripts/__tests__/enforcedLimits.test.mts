import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  parseFrontendFileLineLimits,
  readEnforcedLimits,
} from "../quality/enforcedLimits.mts";

const fixture = (name: string) =>
  readFileSync(join(__dirname, "fixtures/quality", name), "utf8");

const gateConfiguration = {
  eslintConfig: fixture("eslintConfig.txt"),
  jestConfig: fixture("jestConfig.txt"),
  cyclomaticComplexityAnalyzer: fixture("cyclomaticComplexityAnalyzer.txt"),
  fileLengthAnalyzer: fixture("fileLengthAnalyzer.txt"),
  duplicationConfig: fixture("jscpdConfig.json"),
  backendCoverageScript: fixture("backendCoverageScript.txt"),
};

describe("readEnforcedLimits", () => {
  it("reads every cap out of the configuration the gates run on", () => {
    expect(readEnforcedLimits(gateConfiguration)).toEqual({
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
    });
  });

  it("refuses configuration in which a cap has disappeared", () => {
    expect(() =>
      readEnforcedLimits({ ...gateConfiguration, jestConfig: "export {};" }),
    ).toThrow(
      "The jest line coverage threshold could not be read from the gate configuration",
    );
  });
});

describe("parseFrontendFileLineLimits", () => {
  it("takes the looser of the two limits as the one for test files", () => {
    expect(parseFrontendFileLineLimits(gateConfiguration.eslintConfig)).toEqual(
      {
        production: 300,
        test: 600,
      },
    );
  });

  it("refuses a configuration that declares a single limit", () => {
    expect(() =>
      parseFrontendFileLineLimits(
        'rules: { "max-lines": ["error", { max: 300 }] }',
      ),
    ).toThrow("declares 1 max-lines limits");
  });
});
