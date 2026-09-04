import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  countCssModules,
  parseDefinedCustomProperties,
  summarizeDesignSystem,
} from "../quality/designSystemScan.mts";

const fixture = (name: string) =>
  readFileSync(join(__dirname, "fixtures/quality", name), "utf8");

const tokens = fixture("tokens.txt");

describe("parseDefinedCustomProperties", () => {
  it("finds every custom property the token layer defines", () => {
    const properties = parseDefinedCustomProperties(tokens);
    expect(properties).toContain("--base-night-900");
    expect(properties).toContain("--base-ember-500");
    expect(properties.length).toBeGreaterThan(20);
  });

  it("counts a property that is defined twice once", () => {
    expect(
      parseDefinedCustomProperties(":root { --a: 1; }\n.dark { --a: 2; }"),
    ).toEqual(["--a"]);
  });

  it("ignores properties that are only read", () => {
    expect(
      parseDefinedCustomProperties(".chip { color: var(--color-text); }"),
    ).toEqual([]);
  });
});

describe("countCssModules", () => {
  it("counts the co-located CSS modules of the frontend", () => {
    expect(
      countCssModules([
        "frontend/src/app/ActionLedger.module.css",
        "frontend/src/app/tokens.css",
        "frontend/src/app/participant/JoinForm.module.css",
        "backend/Domain/ActionId.cs",
      ]),
    ).toBe(2);
  });
});

describe("summarizeDesignSystem", () => {
  it("reports the tokens per layer and the distinct tokens over all of them", () => {
    const summary = summarizeDesignSystem(
      [
        { path: "frontend/src/app/tokens.css", content: ":root { --a: 1; }" },
        {
          path: "frontend/src/app/presenter/tokens.presenter.css",
          content: ":root { --a: 2; --b: 3; }",
        },
      ],
      ["frontend/src/app/Chip.module.css"],
      69,
    );
    expect(summary).toEqual({
      customProperties: 2,
      tokenFiles: [
        { path: "frontend/src/app/tokens.css", customProperties: 1 },
        {
          path: "frontend/src/app/presenter/tokens.presenter.css",
          customProperties: 2,
        },
      ],
      cssModules: 1,
      contrastAssertions: 69,
    });
  });
});
