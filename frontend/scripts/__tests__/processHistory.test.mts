import { summarizeProcessHistory } from "../quality/processHistory.mts";

const gitOutputs = {
  commitCount: "800\n",
  mergedPullRequests: "66\n",
  firstCommitDate: "2026-07-19T17:25:51+00:00\n",
  contributors: [
    "   706\tJakob Krummeich",
    "    79\tJakobKrummeich",
    "    13\tmaintenance-agent",
    "     2\tvps-valuesworkshop-agent[bot]",
    "",
  ].join("\n"),
};

describe("summarizeProcessHistory", () => {
  it("reads what git answered about the history", () => {
    expect(summarizeProcessHistory(gitOutputs)).toEqual({
      commits: 800,
      mergedPullRequests: 66,
      firstCommitDate: "2026-07-19T17:25:51+00:00",
      contributors: 4,
    });
  });

  it("takes the older root commit when a history has more than one", () => {
    expect(
      summarizeProcessHistory({
        ...gitOutputs,
        firstCommitDate: "2026-07-19T17:25:51+00:00\n2026-07-01T09:00:00+00:00",
      }).firstCommitDate,
    ).toBe("2026-07-01T09:00:00+00:00");
  });

  it("refuses a count git could not answer", () => {
    expect(() =>
      summarizeProcessHistory({ ...gitOutputs, commitCount: "fatal" }),
    ).toThrow("The commit count was not a whole number");
  });

  it("refuses a repository without a first commit", () => {
    expect(() =>
      summarizeProcessHistory({ ...gitOutputs, firstCommitDate: "\n" }),
    ).toThrow("no first commit");
  });
});
