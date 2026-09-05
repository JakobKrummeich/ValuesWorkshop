import fc from "fast-check";
import { actionSlabScaleOf } from "../actionSlabScale";

const smallestScale = 0.4;
const scaleStep = 0.05;

const actionTexts = fc.array(fc.string({ minLength: 0, maxLength: 400 }), {
  minLength: 0,
  maxLength: 12,
});

describe("the action slab scale, for any column of actions", () => {
  it("stays on the ladder of allowed scales", () => {
    fc.assert(
      fc.property(actionTexts, (texts) => {
        const scale = actionSlabScaleOf(texts);

        expect(scale).toBeGreaterThanOrEqual(smallestScale);
        expect(scale).toBeLessThanOrEqual(1);
        expect(Math.round(scale / scaleStep) * scaleStep).toBeCloseTo(
          scale,
          10,
        );
      }),
    );
  });

  it("leaves a short column at full size", () => {
    fc.assert(
      fc.property(
        fc.array(fc.string({ maxLength: 20 }), { maxLength: 3 }),
        (texts) => {
          expect(actionSlabScaleOf(texts)).toBe(1);
        },
      ),
    );
  });

  it("never grows when another action joins the column", () => {
    fc.assert(
      fc.property(
        actionTexts,
        fc.string({ maxLength: 400 }),
        (texts, added) => {
          expect(actionSlabScaleOf([...texts, added])).toBeLessThanOrEqual(
            actionSlabScaleOf(texts),
          );
        },
      ),
    );
  });

  it("never grows when the actions get longer", () => {
    fc.assert(
      fc.property(
        actionTexts,
        fc.string({ maxLength: 100 }),
        (texts, suffix) => {
          expect(
            actionSlabScaleOf(texts.map((text) => text + suffix)),
          ).toBeLessThanOrEqual(actionSlabScaleOf(texts));
        },
      ),
    );
  });

  it("depends on nothing but how long each action is", () => {
    fc.assert(
      fc.property(actionTexts, (texts) => {
        const sameLengths = texts.map((text) => "x".repeat(text.length));

        expect(actionSlabScaleOf(sameLengths)).toBe(actionSlabScaleOf(texts));
      }),
    );
  });
});
