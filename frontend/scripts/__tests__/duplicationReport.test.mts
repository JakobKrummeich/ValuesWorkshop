import { readFileSync } from "node:fs";
import { join } from "node:path";
import { parseDuplicationReport } from "../quality/duplicationReport.mts";

const fixture = (name: string) =>
  readFileSync(join(__dirname, "fixtures/quality", name), "utf8");

describe("parseDuplicationReport", () => {
  const metrics = parseDuplicationReport(fixture("jscpdReport.json"));

  it("reads the totals jscpd computed over the scanned sources", () => {
    expect(metrics).toMatchObject({
      sources: 603,
      lines: 24449,
      tokens: 192120,
      clones: 3,
      duplicatedLines: 28,
      duplicatedTokens: 257,
      duplicatedLinePercentage: 0.11,
      duplicatedTokenPercentage: 0.13,
    });
  });

  it("names the clones with both of their files", () => {
    expect(metrics.largestClones).toHaveLength(1);
    expect(metrics.largestClones[0]).toMatchObject({
      format: "css",
      tokens: 84,
      lines: 13,
    });
    expect(metrics.largestClones[0].firstPath).toContain(
      "WinnerReveal.module.css",
    );
  });

  it("refuses a report without duplication statistics", () => {
    expect(() => parseDuplicationReport('{"duplicates":[]}')).toThrow();
  });
});
