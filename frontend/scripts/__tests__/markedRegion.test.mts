import {
  readMarkedRegion,
  replaceMarkedRegion,
} from "../quality/markedRegion.mts";

const readme = [
  "# Title",
  "",
  "<!-- quality:headline:start -->",
  "| old | table |",
  "<!-- quality:headline:end -->",
  "",
  "Prose that stays.",
  "",
  "<!-- quality:diagram:hotspots:start -->",
  "<!-- quality:diagram:hotspots:end -->",
  "",
].join("\n");

describe("replaceMarkedRegion", () => {
  it("swaps what lies between the markers and leaves everything else alone", () => {
    expect(replaceMarkedRegion(readme, "headline", "| new | table |")).toBe(
      [
        "# Title",
        "",
        "<!-- quality:headline:start -->",
        "| new | table |",
        "<!-- quality:headline:end -->",
        "",
        "Prose that stays.",
        "",
        "<!-- quality:diagram:hotspots:start -->",
        "<!-- quality:diagram:hotspots:end -->",
        "",
      ].join("\n"),
    );
  });

  it("fills a region that is still empty", () => {
    const filled = replaceMarkedRegion(
      readme,
      "diagram:hotspots",
      "```mermaid\nquadrantChart\n```",
    );
    expect(filled).toContain(
      "<!-- quality:diagram:hotspots:start -->\n```mermaid\nquadrantChart\n```\n<!-- quality:diagram:hotspots:end -->",
    );
  });

  it("is idempotent", () => {
    const once = replaceMarkedRegion(readme, "headline", "| new | table |");
    expect(replaceMarkedRegion(once, "headline", "| new | table |")).toBe(once);
  });

  it("refuses a region the document does not have", () => {
    expect(() => replaceMarkedRegion(readme, "badges", "x")).toThrow(
      'The document has no region "badges": expected exactly one "<!-- quality:badges:start -->" and one "<!-- quality:badges:end -->" after it, found 0 and 0.',
    );
  });

  it("refuses a region marked twice", () => {
    expect(() =>
      replaceMarkedRegion(`${readme}\n${readme}`, "headline", "x"),
    ).toThrow("found 2 and 2");
  });

  it("refuses markers in the wrong order", () => {
    const reversed = [
      "<!-- quality:headline:end -->",
      "<!-- quality:headline:start -->",
    ].join("\n");
    expect(() => replaceMarkedRegion(reversed, "headline", "x")).toThrow(
      'The document has no region "headline"',
    );
  });
});

describe("readMarkedRegion", () => {
  it("reads what lies between the markers", () => {
    expect(readMarkedRegion(readme, "headline")).toBe("| old | table |");
  });

  it("reads an empty region as empty", () => {
    expect(readMarkedRegion(readme, "diagram:hotspots")).toBe("");
  });

  it("reads back exactly what was written", () => {
    const content = "```mermaid\ngraph LR\n    a --> b\n```";
    expect(
      readMarkedRegion(
        replaceMarkedRegion(readme, "diagram:hotspots", content),
        "diagram:hotspots",
      ),
    ).toBe(content);
  });
});
