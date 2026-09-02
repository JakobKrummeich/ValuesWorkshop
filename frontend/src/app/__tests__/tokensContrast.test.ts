import {
  contrastRatio,
  over,
  parseColor,
  surfaceColors,
} from "../../testing/designTokens";

const TEXT_MINIMUM = 4.5;
const GRAPHIC_MINIMUM = 3;

const surfaces = [
  "presenter/tokens.presenter.css",
  "participant/tokens.participant.css",
  "facilitator/tokens.facilitator.css",
];

const backgrounds = ["--color-bg", "--color-bg-alt", "--color-surface"];

const textPairings = [
  ...["--color-text", "--color-text-muted"].flatMap((text) =>
    backgrounds.map((background) => [text, background]),
  ),
  ["--color-on-primary", "--color-primary"],
  ["--color-on-accent", "--color-accent"],
  ["--color-danger", "--color-bg"],
  ["--color-danger", "--color-surface"],
  ["--color-danger", "--color-danger-soft"],
];

describe.each(surfaces)("%s", (surfaceFile) => {
  const colorOf = surfaceColors(surfaceFile);
  const paintedOnBackground = (token: string) =>
    over(colorOf(token), colorOf("--color-bg"));

  it.each(textPairings)("reads %s on %s at AA", (text, background) => {
    expect(
      contrastRatio(colorOf(text), paintedOnBackground(background)),
    ).toBeGreaterThanOrEqual(TEXT_MINIMUM);
  });

  it.each(["--color-accent", "--color-highlight"])(
    "sets %s apart from the background",
    (graphic) => {
      expect(
        contrastRatio(colorOf(graphic), colorOf("--color-bg")),
      ).toBeGreaterThanOrEqual(GRAPHIC_MINIMUM);
    },
  );
});

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

  it("names the surface that misses a token", () => {
    expect(() =>
      surfaceColors("facilitator/tokens.facilitator.css")("--color-nowhere"),
    ).toThrow("tokens.facilitator.css does not define --color-nowhere");
  });

  it("names a dangling reference", () => {
    expect(() =>
      surfaceColors("facilitator/tokens.facilitator.css")("--color-bg"),
    ).not.toThrow();
    expect(() => parseColor("var(--base-nowhere)")).toThrow();
  });
});
