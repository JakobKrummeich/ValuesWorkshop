import {
  contrastRatio,
  over,
  parseColor,
  surfaceColors,
} from "../designTokens";

describe("colour parsing", () => {
  it("reads short and long hex", () => {
    expect(parseColor("#fff")).toEqual({
      red: 255,
      green: 255,
      blue: 255,
      alpha: 1,
    });
    expect(parseColor("#07150F")).toEqual({
      red: 7,
      green: 21,
      blue: 15,
      alpha: 1,
    });
    expect(parseColor("#07150F80").alpha).toBeCloseTo(0.5, 1);
  });

  it("reads modern and legacy rgb", () => {
    expect(parseColor("rgb(255 255 255 / 10%)")).toEqual({
      red: 255,
      green: 255,
      blue: 255,
      alpha: 0.1,
    });
    expect(parseColor("rgba(1, 2, 3, 0.5)")).toEqual({
      red: 1,
      green: 2,
      blue: 3,
      alpha: 0.5,
    });
  });

  it("reads a colour mixed into transparency as that colour with alpha", () => {
    expect(parseColor("color-mix(in srgb, #ffb63b 16%, transparent)")).toEqual({
      red: 255,
      green: 182,
      blue: 59,
      alpha: 0.16,
    });
  });

  it("mixes two opaque colours by weight", () => {
    expect(parseColor("color-mix(in srgb, #000 25%, #fff)")).toEqual({
      red: 191,
      green: 191,
      blue: 191,
      alpha: 1,
    });
  });

  it("rejects anything else", () => {
    expect(() => parseColor("hsl(10 20% 30%)")).toThrow(
      "Not a colour this guard can read",
    );
  });
});

describe("contrast maths", () => {
  it("composites translucent colours over their background", () => {
    expect(
      over(parseColor("rgb(255 255 255 / 50%)"), parseColor("#000")),
    ).toEqual({ red: 128, green: 128, blue: 128, alpha: 1 });
  });

  it("rates black on white at the maximum ratio", () => {
    expect(contrastRatio(parseColor("#000"), parseColor("#fff"))).toBeCloseTo(
      21,
      5,
    );
  });
});

describe("surface token lookup", () => {
  it("names the surface that misses a token", () => {
    expect(() =>
      surfaceColors("facilitator/tokens.facilitator.css")("--color-nowhere"),
    ).toThrow("tokens.facilitator.css does not define --color-nowhere");
  });

  it("resolves a defined token and rejects a dangling reference", () => {
    expect(() =>
      surfaceColors("facilitator/tokens.facilitator.css")("--color-bg"),
    ).not.toThrow();
    expect(() => parseColor("var(--base-nowhere)")).toThrow();
  });
});
