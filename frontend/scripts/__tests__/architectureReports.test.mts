import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  parseFolderInstability,
  parseModuleGraph,
  readableRuleName,
} from "../quality/architectureReports.mts";

const fixture = (name: string) =>
  readFileSync(join(__dirname, "fixtures/quality", name), "utf8");

describe("parseModuleGraph", () => {
  it("reads what dependency-cruiser cruised and what it enforced", () => {
    expect(parseModuleGraph(fixture("dependencyCruiserReport.json"))).toEqual({
      modules: 516,
      dependencies: 1829,
      rules: 14,
      violations: 0,
      circularDependencies: 0,
    });
  });

  it("refuses a report without a summary", () => {
    expect(() => parseModuleGraph('{"modules":[]}')).toThrow();
  });
});

describe("parseFolderInstability", () => {
  it("reads the couplings of the folders it is asked about", () => {
    expect(
      parseFolderInstability(fixture("dependencyCruiserMetrics.json"), [
        "src/domain",
        "src/adapters",
      ]),
    ).toEqual([
      {
        folder: "src/domain",
        afferentCouplings: 505,
        efferentCouplings: 21,
        instability: 0.04,
      },
      {
        folder: "src/adapters",
        afferentCouplings: 43,
        efferentCouplings: 122,
        instability: 0.74,
      },
    ]);
  });

  it("refuses to leave out a folder dependency-cruiser did not measure", () => {
    expect(() =>
      parseFolderInstability(fixture("dependencyCruiserMetrics.json"), [
        "src/nowhere",
      ]),
    ).toThrow("no metrics for the folder src/nowhere");
  });
});

describe("readableRuleName", () => {
  it("turns a test method name into the sentence it states", () => {
    expect(readableRuleName("Application_depends_only_on_Domain")).toBe(
      "Application depends only on Domain",
    );
  });
});
