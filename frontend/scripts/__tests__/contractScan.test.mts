import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  countContractFixtures,
  summarizeContract,
} from "../quality/contractScan.mts";
import { parseTrackedFilePaths } from "../quality/sizeScan.mts";

const trackedPaths = parseTrackedFilePaths(
  readFileSync(join(__dirname, "fixtures/quality/gitLsFiles.txt"), "utf8"),
);

describe("countContractFixtures", () => {
  it("groups the checked-in wire fixtures by the role they belong to", () => {
    expect(countContractFixtures(trackedPaths)).toEqual([
      { role: "facilitator", fixtures: 3 },
    ]);
  });

  it("ignores everything outside the state corpus", () => {
    expect(
      countContractFixtures(["contract/enums.json", "contract/README.md"]),
    ).toEqual([]);
  });
});

describe("summarizeContract", () => {
  it("adds the fixtures up and keeps the assertions of both sides", () => {
    expect(summarizeContract(trackedPaths, 41, 2)).toEqual({
      fixtures: 3,
      fixtureGroups: [{ role: "facilitator", fixtures: 3 }],
      frontendAssertions: 41,
      backendTestMethods: 2,
    });
  });

  it("refuses a repository without a wire contract corpus", () => {
    expect(() => summarizeContract(["README.md"], 41, 2)).toThrow(
      "No wire contract fixture was found",
    );
  });
});
