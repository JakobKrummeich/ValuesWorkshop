import { contrastRatio, over, surfaceColors } from "../../testing/designTokens";

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
