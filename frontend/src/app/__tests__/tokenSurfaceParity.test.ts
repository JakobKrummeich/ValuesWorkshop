import { surfaceTokenNames } from "../../testing/designTokens";

const surfaces = [
  "presenter/tokens.presenter.css",
  "participant/tokens.participant.css",
  "facilitator/tokens.facilitator.css",
];

const mappedOnAnySurface = [
  ...new Set(surfaces.flatMap((surface) => surfaceTokenNames(surface))),
].sort();

// WHY: a token missing from one surface layer fails nowhere — the screen falls
// back to the :root defaults in tokens.css, and those are the night skin, so a
// facilitator layer without --color-text paints near-white text on paper, and a
// presenter layer without --text-counter shrinks the wall counter from
// clamp(96px, 11vw, 220px) to 40px. design/visual-system.md § 2 requires every
// surface to map the whole semantic layer; tokensContrast.test.ts names 19 of
// the 53, and shared components (Counter.module.css) read the rest on all three
// surfaces.
describe("every surface maps the same semantic tokens", () => {
  it.each(surfaces)("%s", (surface) => {
    expect(surfaceTokenNames(surface)).toEqual(mappedOnAnySurface);
  });
});
