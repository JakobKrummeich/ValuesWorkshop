import { summarizeMutationReport } from "../quality/mutation/mutationReport.mts";

function reportOf(statuses: Record<string, string[]>): string {
  return JSON.stringify({
    schemaVersion: "2",
    files: Object.fromEntries(
      Object.entries(statuses).map(([path, list]) => [
        path,
        { mutants: list.map((status) => ({ status })) },
      ]),
    ),
  });
}

describe("summarizeMutationReport", () => {
  it("counts every status the run reported across all files", () => {
    expect(
      summarizeMutationReport(
        reportOf({
          "Domain/Session.cs": ["Killed", "Killed", "Survived", "Timeout"],
          "Domain/Group.cs": ["Killed", "NoCoverage", "CompileError"],
        }),
      ),
    ).toEqual({
      score: 66.67,
      killed: 3,
      survived: 1,
      timeout: 1,
      noCoverage: 1,
    });
  });

  it("counts a timed-out mutant as detected and an uncovered one as missed", () => {
    expect(
      summarizeMutationReport(reportOf({ "a.ts": ["Timeout", "NoCoverage"] })),
    ).toMatchObject({ score: 50 });
  });

  it("leaves mutants that never ran out of the score", () => {
    expect(
      summarizeMutationReport(
        reportOf({ "a.ts": ["Killed", "Ignored", "CompileError", "Ignored"] }),
      ),
    ).toMatchObject({ score: 100, killed: 1 });
  });

  it("refuses a report in which no mutant was ever tested", () => {
    expect(() =>
      summarizeMutationReport(reportOf({ "a.ts": ["Ignored"] })),
    ).toThrow("no mutant that was either detected or left undetected");
  });
});
