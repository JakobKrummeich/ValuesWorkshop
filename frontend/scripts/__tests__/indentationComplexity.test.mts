import {
  indentUnitOf,
  measureIndentation,
} from "../quality/hotspots/indentationComplexity.mts";

const typescriptSource = [
  "export function greet(names: string[]): string[] {",
  "  return names.map((name) => {",
  "    if (name.length === 0) {",
  "      return 'stranger';",
  "    }",
  "    return name;",
  "  });",
  "}",
  "",
].join("\n");

const csharpSource = [
  "namespace ValuesWorkshop.Domain;",
  "",
  "public sealed record Session",
  "{",
  "    public void Advance()",
  "    {",
  "        if (Phase == Phase.Join)",
  "        {",
  "            return;",
  "        }",
  "    }",
  "}",
  "",
].join("\n");

describe("indentUnitOf", () => {
  it.each([
    ["backend/Domain/Session.cs", 4],
    ["frontend/src/domain/session.ts", 2],
    ["frontend/src/app/page.tsx", 2],
  ])("knows how far one level of %s is indented", (path, unit) => {
    expect(indentUnitOf(path)).toBe(unit);
  });

  it("refuses a file whose indentation convention it does not know", () => {
    expect(() => indentUnitOf("frontend/src/app/tokens.css")).toThrow(
      "No indentation unit is known for frontend/src/app/tokens.css; the hotspot analysis measures .cs, .ts, .tsx files.",
    );
  });
});

describe("measureIndentation", () => {
  it("adds up the nesting depth of every line and remembers the deepest", () => {
    expect(measureIndentation(typescriptSource, 2)).toEqual({
      total: 11,
      maximumDepth: 3,
    });
  });

  it("reads four spaces as one level in C#", () => {
    expect(measureIndentation(csharpSource, 4)).toEqual({
      total: 12,
      maximumDepth: 3,
    });
  });

  it("counts a tab as one level whatever the unit", () => {
    expect(measureIndentation("a\n\tb\n\t\tc\n\t  d\n", 2)).toEqual({
      total: 5,
      maximumDepth: 2,
    });
  });

  it("ignores blank and whitespace-only lines", () => {
    expect(measureIndentation("  a\n\n    \n  \t\n  b\n", 2)).toEqual({
      total: 2,
      maximumDepth: 1,
    });
  });

  it("keeps a partial level as a fraction rather than rounding it away", () => {
    expect(measureIndentation("   a\n", 2)).toEqual({
      total: 1.5,
      maximumDepth: 1.5,
    });
  });

  it("measures an empty file as flat", () => {
    expect(measureIndentation("", 4)).toEqual({ total: 0, maximumDepth: 0 });
  });
});
