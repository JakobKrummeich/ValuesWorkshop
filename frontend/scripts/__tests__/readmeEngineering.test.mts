import { readMarkedRegion } from "../quality/markedRegion.mts";
import {
  diagramRegionOf,
  headlineRegion,
  mermaidFence,
  readmePath,
  renderReadme,
} from "../quality/readmeEngineering.mts";
import { renderHeadlineTable } from "../quality/readmeHeadlineTable.mts";
import { sampleQualityReport } from "../testing/sampleQualityReport.mts";

const diagrams = [
  {
    path: "docs/quality/frontend-modules.mmd",
    mermaid: '---\ntitle: "frontend"\n---\ngraph LR\n    a --> b\n',
  },
  {
    path: "docs/quality/hotspots.mmd",
    mermaid: 'quadrantChart\n    "a.ts": [0.5, 0.5]\n',
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
  "<!-- quality:diagram:hotspots:start -->",
  "stale",
  "<!-- quality:diagram:hotspots:end -->",
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

describe("renderReadme", () => {
  const rendered = renderReadme(readme, sampleQualityReport, diagrams);

  it("writes the headline table into its region", () => {
    expect(readMarkedRegion(rendered, headlineRegion)).toBe(
      renderHeadlineTable(sampleQualityReport),
    );
  });

  it("writes every diagram into its region, front matter included", () => {
    expect(readMarkedRegion(rendered, "diagram:frontend-modules")).toBe(
      '```mermaid\n---\ntitle: "frontend"\n---\ngraph LR\n    a --> b\n```',
    );
    expect(readMarkedRegion(rendered, "diagram:hotspots")).toBe(
      '```mermaid\nquadrantChart\n    "a.ts": [0.5, 0.5]\n```',
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
