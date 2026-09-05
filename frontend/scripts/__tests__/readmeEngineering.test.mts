import {
  hotspotColumns,
  renderHotspotsTable,
} from "../quality/hotspots/hotspotsTable.mts";
import { readMarkedRegion } from "../quality/markedRegion.mts";
import {
  diagramRegionOf,
  headlineRegion,
  hotspotsRegion,
  mermaidFence,
  readmePath,
  renderReadme,
  renderReadmeDiagrams,
} from "../quality/readmeEngineering.mts";
import { renderHeadlineTable } from "../quality/readmeHeadlineTable.mts";
import { sampleQualityReport } from "../testing/sampleQualityReport.mts";

const diagrams = [
  {
    path: "docs/quality/frontend-modules.mmd",
    mermaid: '---\ntitle: "frontend"\n---\ngraph LR\n    a --> b\n',
  },
  {
    path: "docs/quality/backend-layers.mmd",
    mermaid: "graph TD\n    Api --> Domain\n",
  },
];

const readme = [
  "# ValuesWorkshop",
  "",
  "## Engineering",
  "",
  "<!-- quality:headline:start -->",
  "<!-- quality:headline:end -->",
  "",
  "Folded from dependency-cruiser's report.",
  "",
  "<!-- quality:diagram:frontend-modules:start -->",
  "<!-- quality:diagram:frontend-modules:end -->",
  "",
  "<!-- quality:diagram:backend-layers:start -->",
  "stale",
  "<!-- quality:diagram:backend-layers:end -->",
  "",
  "### Hotspots",
  "",
  "<!-- quality:hotspots:start -->",
  "<!-- quality:hotspots:end -->",
  "",
  "## Run the demo",
  "",
].join("\n");

describe("diagramRegionOf", () => {
  it("names a diagram's region after its file", () => {
    expect(diagramRegionOf("docs/quality/backend-layers.mmd")).toBe(
      "diagram:backend-layers",
    );
  });
});

describe("mermaidFence", () => {
  it("wraps the diagram text verbatim in a mermaid code fence", () => {
    expect(mermaidFence("graph LR\n    a --> b\n")).toBe(
      "```mermaid\ngraph LR\n    a --> b\n```",
    );
  });
});

describe("renderReadmeDiagrams", () => {
  const rendered = renderReadmeDiagrams(readme, diagrams);

  it("refreshes the diagrams before any number is measured, so the drift gate inside the measurement sees the README it will be checked against", () => {
    expect(readMarkedRegion(rendered, "diagram:backend-layers")).toBe(
      "```mermaid\ngraph TD\n    Api --> Domain\n```",
    );
    expect(rendered).not.toContain("stale");
  });

  it("leaves the tables for the measurement to fill in", () => {
    expect(readMarkedRegion(rendered, headlineRegion)).toBe("");
    expect(readMarkedRegion(rendered, hotspotsRegion)).toBe("");
  });
});

describe("renderReadme", () => {
  const rendered = renderReadme(readme, sampleQualityReport, diagrams);

  it("writes the headline table into its region", () => {
    expect(readMarkedRegion(rendered, headlineRegion)).toBe(
      renderHeadlineTable(sampleQualityReport),
    );
  });

  it("writes the top hotspots into their region, the most complex function left out", () => {
    expect(readMarkedRegion(rendered, hotspotsRegion)).toBe(
      renderHotspotsTable(sampleQualityReport.hotspots.hotspots, [
        hotspotColumns.file,
        hotspotColumns.side,
        hotspotColumns.commits,
        hotspotColumns.linesChanged,
        hotspotColumns.complexity,
        hotspotColumns.score,
      ]),
    );
    expect(readMarkedRegion(rendered, hotspotsRegion)).toContain(
      "| `backend/Domain/Session.cs` | backend | 61 | 1,480 | 412 | 25,132 |",
    );
  });

  it("writes every diagram into its region, front matter included", () => {
    expect(readMarkedRegion(rendered, "diagram:frontend-modules")).toBe(
      '```mermaid\n---\ntitle: "frontend"\n---\ngraph LR\n    a --> b\n```',
    );
    expect(readMarkedRegion(rendered, "diagram:backend-layers")).toBe(
      "```mermaid\ngraph TD\n    Api --> Domain\n```",
    );
    expect(rendered).not.toContain("stale");
  });

  it("leaves the hand-written prose alone", () => {
    expect(rendered).toContain(
      "## Engineering\n\n<!-- quality:headline:start -->",
    );
    expect(rendered).toContain("Folded from dependency-cruiser's report.");
    expect(rendered.endsWith("## Run the demo\n")).toBe(true);
  });

  it("changes nothing when run again", () => {
    expect(renderReadme(rendered, sampleQualityReport, diagrams)).toBe(
      rendered,
    );
  });

  it("refuses a README that lost a region", () => {
    expect(() =>
      renderReadme(
        readme.replace("<!-- quality:headline:start -->", ""),
        sampleQualityReport,
        diagrams,
      ),
    ).toThrow('The document has no region "headline"');
  });

  it("maintains the README at the repository root", () => {
    expect(readmePath).toBe("README.md");
  });
});
