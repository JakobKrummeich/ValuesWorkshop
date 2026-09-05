import {
  readMarkedRegion,
  replaceMarkedRegion,
  withoutMarkedRegions,
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
  "<!-- quality:diagram:backend-layers:start -->",
  "<!-- quality:diagram:backend-layers:end -->",
  "",
].join("\n");

describe("replaceMarkedRegion", () => {
  it("swaps what lies between the markers, set off by blank lines so markdown starts a fresh block, and leaves everything else alone", () => {
    expect(replaceMarkedRegion(readme, "headline", "| new | table |")).toBe(
      [
        "# Title",
        "",
        "<!-- quality:headline:start -->",
        "",
        "| new | table |",
        "",
        "<!-- quality:headline:end -->",
        "",
        "Prose that stays.",
        "",
        "<!-- quality:diagram:backend-layers:start -->",
        "<!-- quality:diagram:backend-layers:end -->",
        "",
      ].join("\n"),
    );
  });

  it("fills a region that is still empty", () => {
    const filled = replaceMarkedRegion(
      readme,
      "diagram:backend-layers",
      "```mermaid\ngraph TD\n```",
    );
    expect(filled).toContain(
      "<!-- quality:diagram:backend-layers:start -->\n\n```mermaid\ngraph TD\n```\n\n<!-- quality:diagram:backend-layers:end -->",
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
    expect(readMarkedRegion(readme, "diagram:backend-layers")).toBe("");
  });

  it("reads back exactly what was written", () => {
    const content = "```mermaid\ngraph LR\n    a --> b\n```";
    expect(
      readMarkedRegion(
        replaceMarkedRegion(readme, "diagram:backend-layers", content),
        "diagram:backend-layers",
      ),
    ).toBe(content);
  });
});

describe("withoutMarkedRegions", () => {
  it("keeps the hand-written lines and drops every generated region with its markers", () => {
    expect(withoutMarkedRegions(readme)).toBe(
      ["# Title", "", "", "Prose that stays.", "", ""].join("\n"),
    );
  });

  it("leaves a document without regions untouched", () => {
    expect(withoutMarkedRegions("# Title\n\nProse.\n")).toBe(
      "# Title\n\nProse.\n",
    );
  });
});
