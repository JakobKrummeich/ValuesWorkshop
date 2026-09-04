import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  areaOf,
  countLines,
  extensionOf,
  isMeasuredPath,
  parseTrackedFilePaths,
  RepositoryArea,
  RepositorySide,
  SourceKind,
  sourceKindOf,
  summarizeSize,
} from "../quality/sizeScan.mts";

const trackedPaths = parseTrackedFilePaths(
  readFileSync(join(__dirname, "fixtures/quality/gitLsFiles.txt"), "utf8"),
);

describe("parseTrackedFilePaths", () => {
  it("reads every path git listed", () => {
    expect(trackedPaths).toContain("backend/Domain/ActionId.cs");
    expect(trackedPaths).toContain(".gitignore");
    expect(trackedPaths.every((path) => path.trim() === path)).toBe(true);
  });
});

describe("isMeasuredPath", () => {
  it("leaves binary assets out", () => {
    expect(isMeasuredPath("docs/media/demo.mp4")).toBe(false);
    expect(isMeasuredPath("docs/media/demo.gif")).toBe(false);
    expect(isMeasuredPath("frontend/public/fonts/inter.woff2")).toBe(false);
  });

  it("leaves the generated report out so the scan cannot measure itself", () => {
    expect(isMeasuredPath("docs/quality/metrics.md")).toBe(false);
    expect(isMeasuredPath("docs/quality/metrics.json")).toBe(false);
  });

  it("leaves generated code out so the counts stay hand-written code", () => {
    expect(isMeasuredPath("pnpm-lock.yaml")).toBe(false);
    expect(isMeasuredPath("frontend/package-lock.json")).toBe(false);
    expect(
      isMeasuredPath(
        "backend/Adapters.Persistence/Migrations/20260803053722_Initial.cs",
      ),
    ).toBe(false);
    expect(isMeasuredPath("frontend/src/domain/phases.ts")).toBe(false);
  });

  it("keeps tracked source and prose", () => {
    expect(isMeasuredPath("backend/Domain/ActionId.cs")).toBe(true);
    expect(isMeasuredPath("design/architecture.md")).toBe(true);
  });
});

describe("areaOf", () => {
  it.each([
    ["backend/Domain/ActionId.cs", RepositoryArea.Backend],
    ["frontend/src/app/ActionLedger.tsx", RepositoryArea.FrontendSource],
    ["frontend/scripts/auditDependencies.mts", RepositoryArea.Scripts],
    ["scripts/ci-lint.sh", RepositoryArea.Scripts],
    ["e2e/auth.spec.ts", RepositoryArea.EndToEnd],
    ["contract/state/facilitator/finalVoting.json", RepositoryArea.Contract],
    ["design/architecture.md", RepositoryArea.Design],
    ["tasks/plan-review.html", RepositoryArea.Tasks],
    [".github/workflows/ci.yml", RepositoryArea.Other],
  ])("files %s under %s", (path, area) => {
    expect(areaOf(path)).toBe(area);
  });
});

describe("sourceKindOf", () => {
  it.each([
    "backend/Domain.Tests/ArchitectureTests.cs",
    "backend/TestSupport/FixedRandomness.cs",
    "frontend/src/domain/__tests__/groupFormation.test.ts",
    "e2e/auth.spec.ts",
  ])("counts %s as test code", (path) => {
    expect(sourceKindOf(path)).toBe(SourceKind.Test);
  });

  it.each(["backend/Domain/ActionId.cs", "frontend/src/shared/motion.ts"])(
    "counts %s as production code",
    (path) => {
      expect(sourceKindOf(path)).toBe(SourceKind.Production);
    },
  );
});

describe("extensionOf", () => {
  it.each([
    ["backend/Domain/ActionId.cs", "cs"],
    ["frontend/src/app/ActionLedger.module.css", "css"],
    ["scripts/ci-lint.sh", "sh"],
    [".gitignore", "none"],
  ])("reads the extension of %s as %s", (path, extension) => {
    expect(extensionOf(path)).toBe(extension);
  });
});

describe("countLines", () => {
  it.each([
    ["", 0],
    ["one line\n", 1],
    ["no trailing newline", 1],
    ["two\nlines\n", 2],
  ])("counts %j as %i lines", (content, lines) => {
    expect(countLines(content)).toBe(lines);
  });
});

describe("summarizeSize", () => {
  const measured = trackedPaths
    .filter(isMeasuredPath)
    .map((path, index) => ({ path, lineCount: index + 1 }));
  const summary = summarizeSize(measured);

  it("splits production from test lines", () => {
    expect(summary.files).toBe(measured.length);
    expect(summary.productionLines + summary.testLines).toBe(
      summary.totalLines,
    );
    expect(summary.testLines).toBeGreaterThan(0);
  });

  it("adds up to the same totals per area", () => {
    expect(summary.areas.reduce((sum, area) => sum + area.files, 0)).toBe(
      summary.files,
    );
    expect(summary.areas.map((area) => area.area)).toContain(
      RepositoryArea.Backend,
    );
  });

  it("orders the extensions by how many files carry them", () => {
    const counts = summary.filesByExtension.map((entry) => entry.files);
    expect([...counts].sort((left, right) => right - left)).toEqual(counts);
    expect(summary.filesByExtension[0].extension).toBe("cs");
  });

  it("names the longest production and test file on each side", () => {
    expect(summary.longestFiles.map((file) => [file.side, file.kind])).toEqual([
      [RepositorySide.Backend, SourceKind.Production],
      [RepositorySide.Backend, SourceKind.Test],
      [RepositorySide.Frontend, SourceKind.Production],
      [RepositorySide.Frontend, SourceKind.Test],
    ]);
    for (const longest of summary.longestFiles) {
      const candidates = measured.filter(
        (file) =>
          file.path.startsWith(longest.side) &&
          sourceKindOf(file.path) === longest.kind,
      );
      expect(longest.lineCount).toBe(
        Math.max(...candidates.map((file) => file.lineCount)),
      );
    }
  });
});
