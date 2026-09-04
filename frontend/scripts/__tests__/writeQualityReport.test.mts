import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  metricsJsonPath,
  metricsMarkdownPath,
  writeQualityReport,
} from "../quality/writeQualityReport.mts";

describe("writeQualityReport", () => {
  it("names the two artifacts it maintains", () => {
    expect(metricsJsonPath).toBe("docs/quality/metrics.json");
    expect(metricsMarkdownPath).toBe("docs/quality/metrics.md");
  });

  it("writes nothing and fails loudly when a measurement fails", () => {
    const emptyDirectory = mkdtempSync(join(tmpdir(), "quality-report-test-"));
    try {
      const outcome = writeQualityReport(
        emptyDirectory,
        "2026-09-04T15:00:00Z",
      );
      expect(outcome.exitCode).toBe(1);
      expect(outcome.report).toContain(
        "The quality report was not written because a measurement failed",
      );
    } finally {
      rmSync(emptyDirectory, { recursive: true, force: true });
    }
  });
});
