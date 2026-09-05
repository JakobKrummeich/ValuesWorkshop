import type { ChurnHistory } from "../quality/hotspots/gitChurn.mts";
import {
  isHotspotCandidate,
  rankHotspots,
  reportedHotspots,
  type AnalysedFile,
} from "../quality/hotspots/hotspotAnalysis.mts";
import { RepositorySide } from "../quality/sizeScan.mts";

const session: AnalysedFile = {
  path: "backend/Domain/Session.cs",
  content:
    "class Session\n{\n    void Advance()\n    {\n        return;\n    }\n}\n",
};
const page: AnalysedFile = {
  path: "frontend/src/app/facilitator/page.tsx",
  content:
    "export default function Page() {\n  return (\n    <main />\n  );\n}\n",
};
const flat: AnalysedFile = {
  path: "frontend/src/domain/phaseOrder.ts",
  content: "export const phaseOrder = [];\n",
};

const history: ChurnHistory = {
  commits: 40,
  byPath: new Map([
    ["backend/Domain/Session.cs", { commits: 12, linesChanged: 400 }],
    ["frontend/src/app/facilitator/page.tsx", { commits: 9, linesChanged: 90 }],
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

describe("rankHotspots", () => {
  const metrics = rankHotspots([flat, page, session], history);

  it("scores every file by commits times indentation complexity, highest first", () => {
    expect(metrics.hotspots).toEqual([
      {
        path: "backend/Domain/Session.cs",
        side: RepositorySide.Backend,
        commits: 12,
        linesChanged: 400,
        complexity: 5,
        maximumDepth: 2,
        score: 60,
      },
      {
        path: "frontend/src/app/facilitator/page.tsx",
        side: RepositorySide.Frontend,
        commits: 9,
        linesChanged: 90,
        complexity: 4,
        maximumDepth: 2,
        score: 36,
      },
      {
        path: "frontend/src/domain/phaseOrder.ts",
        side: RepositorySide.Frontend,
        commits: 0,
        linesChanged: 0,
        complexity: 0,
        maximumDepth: 0,
        score: 0,
      },
    ]);
  });

  it("says how much it looked at", () => {
    expect(metrics.filesAnalysed).toBe(3);
    expect(metrics.commitsInHistory).toBe(40);
  });

  it("breaks a tie in score by path so the ranking is stable", () => {
    const twin: AnalysedFile = {
      path: "backend/Domain/Aardvark.cs",
      content: session.content,
    };
    const tied = rankHotspots([session, twin], {
      commits: 40,
      byPath: new Map([
        [session.path, { commits: 12, linesChanged: 1 }],
        [twin.path, { commits: 12, linesChanged: 1 }],
      ]),
    });
    expect(tied.hotspots.map((hotspot) => hotspot.path)).toEqual([
      "backend/Domain/Aardvark.cs",
      "backend/Domain/Session.cs",
    ]);
  });

  it("reports the top fifteen of everything it ranked", () => {
    const files = Array.from({ length: 20 }, (_, index) => ({
      path: `backend/Domain/File${String(index).padStart(2, "0")}.cs`,
      content: "    x\n",
    }));
    const many = rankHotspots(files, {
      commits: 100,
      byPath: new Map(
        files.map((file, index) => [
          file.path,
          { commits: index + 1, linesChanged: index },
        ]),
      ),
    });
    expect(reportedHotspots).toBe(15);
    expect(many.hotspots).toHaveLength(15);
    expect(many.hotspots[0].path).toBe("backend/Domain/File19.cs");
    expect(many.filesAnalysed).toBe(20);
  });

  it("refuses a file outside the two production code areas", () => {
    expect(() =>
      rankHotspots(
        [{ path: "scripts/demoVideo/encodeFilm.ts", content: "" }],
        history,
      ),
    ).toThrow(
      "scripts/demoVideo/encodeFilm.ts is neither backend nor frontend source; rank hotspot candidates only.",
    );
  });

  it("refuses to rank nothing", () => {
    expect(() => rankHotspots([], history)).toThrow(
      "The hotspot analysis found no production code file to rank.",
    );
  });
});
