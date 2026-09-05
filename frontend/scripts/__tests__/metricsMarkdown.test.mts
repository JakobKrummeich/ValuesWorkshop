import { renderMetricsMarkdown } from "../quality/metricsMarkdown.mts";
import { sampleQualityReport as report } from "../testing/sampleQualityReport.mts";

describe("renderMetricsMarkdown", () => {
  const markdown = renderMetricsMarkdown(report);

  it("stamps the commit, its date and the moment of the run", () => {
    expect(markdown).toContain("`fd3cb1b` — Task 30 is specified and sliced");
    expect(markdown).toContain("2026-09-04T14:03:27+00:00");
    expect(markdown).toContain("2026-09-04T15:00:00.000Z");
  });

  it("opens every group with the command that produced its numbers", () => {
    const groups = markdown
      .split("\n")
      .filter((line) => line.startsWith("## "));
    expect(groups).toEqual([
      "## Size",
      "## Tests and coverage",
      "## Complexity",
      "## Duplication",
      "## Hotspots",
      "## Architecture",
      "## Design system",
      "## Wire contract",
      "## Mutation testing",
      "## Security",
      "## Supply chain",
      "## Process",
    ]);
    expect(markdown.split("Produced by:")).toHaveLength(groups.length + 1);
  });

  it("puts every measured number next to the limit that is enforced", () => {
    expect(markdown).toContain("at least 80%");
    expect(markdown).toContain("at most 7 (analyzer VW1001)");
    expect(markdown).toContain("at most 2%");
  });

  it("names the longest file on each side against the cap it lives under", () => {
    expect(markdown).toContain(
      "`backend/Domain/Session.cs` | 289 | at most 300",
    );
    expect(markdown).toContain(
      "`frontend/src/app/__tests__/page.test.tsx` | 480 | at most 600",
    );
  });

  it("groups thousands so the totals stay readable", () => {
    expect(markdown).toContain("2,057");
    expect(markdown).toContain("192,120");
  });

  it("reports the mutation score against the commit it was measured at", () => {
    expect(markdown).toContain("| frontend | StrykerJS 10.0.0 | 81.25% |");
    expect(markdown).toContain("| backend | Stryker.NET 4.16.0 | 75.41% |");
    expect(markdown).toContain(
      "The frontend score was measured at `fd3cb1b`, the commit this report describes.",
    );
  });

  it("says plainly that a mutation score describes another commit", () => {
    const stale = renderMetricsMarkdown({
      ...report,
      mutation: {
        ...report.mutation,
        backend: {
          ...report.mutation.backend!,
          commit: "9b1c0f4a2d6e8c0b4a2d6e8c0b4a2d6e8c0b4a2d",
        },
      },
    });
    expect(stale).toContain(
      "The backend score was measured at `9b1c0f4`, not at `fd3cb1b` — the commit this report describes — so it does not describe the code as it stands.",
    );
  });

  it("says plainly that a side was never measured", () => {
    const unmeasured = renderMetricsMarkdown({ ...report, mutation: {} });
    expect(unmeasured).toContain(
      "No frontend run is recorded, so the frontend score is absent rather than zero.",
    );
    expect(unmeasured).toContain(
      "No backend run is recorded, so the backend score is absent rather than zero.",
    );
    expect(unmeasured).toContain("- `pnpm mutation:frontend`");
    expect(unmeasured).not.toContain("| mutation score |");
  });

  it("counts the components of every bill of materials", () => {
    expect(markdown).toContain(
      "| `docs/quality/sbom/frontend.cdx.json` | frontend runtime dependencies of the pnpm workspace | 32 |",
    );
    expect(markdown).toContain(
      "osv-scanner over `pnpm-lock.yaml` and both bills of materials | 0 | 0 | No known advisories |",
    );
  });

  it("ends in a single newline", () => {
    expect(markdown.endsWith("\n")).toBe(true);
    expect(markdown.endsWith("\n\n")).toBe(false);
  });
});
