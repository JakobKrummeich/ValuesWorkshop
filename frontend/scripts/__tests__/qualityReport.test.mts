import {
  parseCommitStamp,
  renderQualityReportJson,
  resolveGeneratedAt,
  toRepositoryPath,
} from "../quality/qualityReport.mts";

const gitShowOutput = [
  "fd3cb1bee884e8679c0de08042e0da7c724593c0",
  "2026-09-04T14:03:27+00:00",
  "Task 30 is specified and sliced",
].join("\n");

describe("parseCommitStamp", () => {
  it("reads the commit the report describes", () => {
    expect(parseCommitStamp(`${gitShowOutput}\n`)).toEqual({
      sha: "fd3cb1bee884e8679c0de08042e0da7c724593c0",
      shortSha: "fd3cb1b",
      committedAt: "2026-09-04T14:03:27+00:00",
      subject: "Task 30 is specified and sliced",
    });
  });

  it("keeps a subject that git wrapped over several lines", () => {
    expect(parseCommitStamp(`${gitShowOutput}\nand sliced again`).subject).toBe(
      "Task 30 is specified and sliced and sliced again",
    );
  });

  it("refuses output that does not describe a commit", () => {
    expect(() => parseCommitStamp("\n")).toThrow(
      "did not describe the commit under measurement",
    );
  });
});

describe("resolveGeneratedAt", () => {
  const previousReport = JSON.stringify({
    generatedAt: "2026-09-04T15:00:00.000Z",
    commit: { sha: "aaa" },
  });

  it("stamps the moment of the run when no report exists yet", () => {
    expect(resolveGeneratedAt(undefined, "aaa", "now")).toBe("now");
  });

  it("keeps the earlier stamp while the measured commit is unchanged", () => {
    expect(resolveGeneratedAt(previousReport, "aaa", "now")).toBe(
      "2026-09-04T15:00:00.000Z",
    );
  });

  it("restamps once the measured commit moved on", () => {
    expect(resolveGeneratedAt(previousReport, "bbb", "now")).toBe("now");
  });

  it("restamps when the existing report cannot be read", () => {
    expect(resolveGeneratedAt("{}", "aaa", "now")).toBe("now");
  });
});

describe("toRepositoryPath", () => {
  it("shortens a tool's absolute path to a repository path", () => {
    expect(toRepositoryPath("/repo/frontend/src/app/page.tsx", "/repo")).toBe(
      "frontend/src/app/page.tsx",
    );
  });

  it("leaves a path outside the repository alone", () => {
    expect(toRepositoryPath("/elsewhere/page.tsx", "/repo")).toBe(
      "/elsewhere/page.tsx",
    );
  });
});

describe("renderQualityReportJson", () => {
  it("writes indented json that ends in a newline", () => {
    const json = renderQualityReportJson({
      generatedAt: "now",
    } as never);
    expect(json).toBe('{\n  "generatedAt": "now"\n}\n');
  });
});
