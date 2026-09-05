import type { ComplexFunction } from "../quality/complexityScan.mts";
import type { ChurnHistory } from "../quality/hotspots/gitChurn.mts";
import {
  complexityByFile,
  isHotspotCandidate,
  rankHotspots,
  reportedHotspots,
} from "../quality/hotspots/hotspotAnalysis.mts";
import { RepositorySide } from "../quality/sizeScan.mts";

const session = "backend/Domain/Session.cs";
const page = "frontend/src/app/facilitator/page.tsx";
const flat = "frontend/src/domain/phaseOrder.ts";

const measured: ComplexFunction[] = [
  { path: session, line: 40, name: "Advance", complexity: 4 },
  { path: session, line: 12, name: "Open", complexity: 1 },
  { path: page, line: 8, name: "Function 'Page'", complexity: 3 },
  { path: page, line: 30, name: "Arrow function", complexity: 1 },
  {
    path: "backend/Domain.Tests/SessionTests.cs",
    line: 9,
    name: "Advances",
    complexity: 2,
  },
];

const history: ChurnHistory = {
  commits: 40,
  byPath: new Map([
    [session, { commits: 12, linesChanged: 400 }],
    [page, { commits: 9, linesChanged: 90 }],
    ["backend/Domain/Untouched.cs", { commits: 3, linesChanged: 30 }],
  ]),
};

describe("isHotspotCandidate", () => {
  it.each([
    "backend/Domain/Session.cs",
    "frontend/src/domain/session.ts",
    "frontend/src/app/facilitator/page.tsx",
  ])("analyses the production code file %s", (path) => {
    expect(isHotspotCandidate(path)).toBe(true);
  });

  it.each([
    "backend/Domain.Tests/SessionTests.cs",
    "frontend/src/domain/__tests__/session.test.ts",
    "frontend/src/app/page.test.tsx",
    "backend/TestSupport/WorkshopGenerators.cs",
    "e2e/sessionLifecycle.spec.ts",
    "frontend/scripts/quality/sizeScan.mts",
    "scripts/demoVideo/encodeFilm.ts",
    "frontend/src/app/tokens.css",
    "backend/Adapters.Persistence/Migrations/20260803053722_Initial.cs",
    "frontend/src/domain/phases.ts",
    "design/architecture.md",
  ])("leaves %s out", (path) => {
    expect(isHotspotCandidate(path)).toBe(false);
  });
});

describe("complexityByFile", () => {
  it("sums a file's functions and remembers its most complex one", () => {
    expect(complexityByFile(measured).get(session)).toEqual({
      total: 5,
      maximum: 4,
      functions: 2,
    });
  });

  it("knows nothing about a file without a measured function", () => {
    expect(complexityByFile(measured).has(flat)).toBe(false);
  });
});

describe("rankHotspots", () => {
  const metrics = rankHotspots([flat, page, session], history, measured);

  it("scores every file by commits times its summed cyclomatic complexity, highest first", () => {
    expect(metrics.hotspots).toEqual([
      {
        path: session,
        side: RepositorySide.Backend,
        commits: 12,
        linesChanged: 400,
        complexity: 5,
        mostComplexFunction: 4,
        score: 60,
      },
      {
        path: page,
        side: RepositorySide.Frontend,
        commits: 9,
        linesChanged: 90,
        complexity: 4,
        mostComplexFunction: 3,
        score: 36,
      },
      {
        path: flat,
        side: RepositorySide.Frontend,
        commits: 0,
        linesChanged: 0,
        complexity: 0,
        mostComplexFunction: 0,
        score: 0,
      },
    ]);
  });

  it("ranks only the candidates it was given, whatever else was measured", () => {
    expect(metrics.hotspots.map((hotspot) => hotspot.path)).not.toContain(
      "backend/Domain.Tests/SessionTests.cs",
    );
  });

  it("says how much it looked at", () => {
    expect(metrics.filesAnalysed).toBe(3);
    expect(metrics.commitsInHistory).toBe(40);
  });

  it("breaks a tie in score by path so the ranking is stable", () => {
    const twin = "backend/Domain/Aardvark.cs";
    const tied = rankHotspots(
      [session, twin],
      {
        commits: 40,
        byPath: new Map([
          [session, { commits: 12, linesChanged: 1 }],
          [twin, { commits: 12, linesChanged: 1 }],
        ]),
      },
      [
        ...measured,
        { path: twin, line: 40, name: "Advance", complexity: 4 },
        { path: twin, line: 12, name: "Open", complexity: 1 },
      ],
    );
    expect(tied.hotspots.map((hotspot) => hotspot.path)).toEqual([
      "backend/Domain/Aardvark.cs",
      "backend/Domain/Session.cs",
    ]);
  });

  it("reports the top fifteen of everything it ranked", () => {
    const paths = Array.from(
      { length: 20 },
      (_, index) => `backend/Domain/File${String(index).padStart(2, "0")}.cs`,
    );
    const many = rankHotspots(
      paths,
      {
        commits: 100,
        byPath: new Map(
          paths.map((path, index) => [
            path,
            { commits: index + 1, linesChanged: index },
          ]),
        ),
      },
      paths.map((path) => ({ path, line: 1, name: "Run", complexity: 1 })),
    );
    expect(reportedHotspots).toBe(15);
    expect(many.hotspots).toHaveLength(15);
    expect(many.hotspots[0].path).toBe("backend/Domain/File19.cs");
    expect(many.filesAnalysed).toBe(20);
  });

  it("refuses a file outside the two production code areas", () => {
    expect(() =>
      rankHotspots(["scripts/demoVideo/encodeFilm.ts"], history, measured),
    ).toThrow(
      "scripts/demoVideo/encodeFilm.ts is neither backend nor frontend source; rank hotspot candidates only.",
    );
  });

  it("refuses to rank nothing", () => {
    expect(() => rankHotspots([], history, measured)).toThrow(
      "The hotspot analysis found no production code file to rank.",
    );
  });
});
