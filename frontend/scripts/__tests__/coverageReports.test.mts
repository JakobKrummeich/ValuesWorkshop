import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  parseBackendCoverageSummary,
  parseFrontendCoverageSummary,
} from "../quality/coverageReports.mts";

const fixture = (name: string) =>
  readFileSync(join(__dirname, "fixtures/quality", name), "utf8");

describe("parseFrontendCoverageSummary", () => {
  it("reads the totals out of the jest json-summary reporter", () => {
    expect(
      parseFrontendCoverageSummary(fixture("frontendCoverageSummary.json")),
    ).toEqual({
      linePercentage: 97.53,
      coveredLines: 2257,
      coverableLines: 2314,
      branchPercentage: 93.6,
    });
  });

  it("refuses a summary without totals", () => {
    expect(() => parseFrontendCoverageSummary('{"total":{}}')).toThrow();
  });
});

describe("parseBackendCoverageSummary", () => {
  it("reads the totals out of the reportgenerator text summary", () => {
    expect(
      parseBackendCoverageSummary(fixture("backendCoverageSummary.txt")),
    ).toEqual({
      linePercentage: 98.7,
      coveredLines: 9693,
      coverableLines: 9817,
      branchPercentage: 93.9,
    });
  });

  it("refuses a summary that is missing a number", () => {
    expect(() => parseBackendCoverageSummary("Summary\n")).toThrow(
      "holds no `Line coverage` line",
    );
  });
});
