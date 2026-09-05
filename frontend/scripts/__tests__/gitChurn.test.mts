import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  churnLogArguments,
  parseChurnLog,
} from "../quality/hotspots/gitChurn.mts";

const numstatLog = readFileSync(
  join(__dirname, "fixtures/quality/gitNumstatLog.txt"),
  "utf8",
);

describe("churnLogArguments", () => {
  it("walks the history from the measured commit without following renames", () => {
    expect(
      churnLogArguments("d6aadb117679750af67e07cbaa972d7cf2d7c917"),
    ).toEqual([
      "log",
      "--numstat",
      "--no-renames",
      "--format=%H",
      "d6aadb117679750af67e07cbaa972d7cf2d7c917",
    ]);
  });
});

describe("parseChurnLog", () => {
  const history = parseChurnLog(numstatLog);

  it("counts every commit git listed, merge commits without a diff included", () => {
    expect(history.commits).toBe(6);
  });

  it("adds up the commits and the changed lines per path", () => {
    expect(history.byPath.get("scripts/demoVideo/dockerFfmpeg.ts")).toEqual({
      commits: 2,
      linesChanged: 31,
    });
    expect(history.byPath.get("README.md")).toEqual({
      commits: 1,
      linesChanged: 24,
    });
    expect(history.byPath.get("scripts/demoVideo/planFilmFrames.ts")).toEqual({
      commits: 1,
      linesChanged: 93,
    });
  });

  it("leaves binary files out because git cannot count their lines", () => {
    expect(history.byPath.has("docs/media/demo.gif")).toBe(false);
    expect(history.byPath.has("docs/media/demo.mp4")).toBe(false);
  });

  it("knows every path that changed", () => {
    expect(history.byPath.size).toBe(13);
  });

  it("reads an empty history as no commits at all", () => {
    expect(parseChurnLog("")).toEqual({ commits: 0, byPath: new Map() });
  });

  it("refuses a line that is neither a commit nor a numstat row", () => {
    expect(() => parseChurnLog("fatal: not a git repository\n")).toThrow(
      'git printed "fatal: not a git repository", which is neither a commit hash nor a numstat row.',
    );
  });
});
