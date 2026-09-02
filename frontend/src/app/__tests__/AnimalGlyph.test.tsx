import { render } from "@testing-library/react";
import { AnimalGlyph } from "../AnimalGlyph";
import { AnimalId, animalGlyphOf } from "../animalGlyphs";

describe("animal glyph", () => {
  it.each(Object.values(AnimalId))(
    "draws the %s as line strokes with filled marks, hidden from readers",
    (animalId) => {
      const { container } = render(<AnimalGlyph animalId={animalId} />);

      const svg = container.querySelector("svg");
      expect(svg).toHaveAttribute("aria-hidden", "true");
      expect(svg).toHaveAttribute("viewBox", "0 0 32 32");
      expect(svg).toHaveAttribute("stroke", "currentColor");
      expect(container.querySelectorAll("path").length).toBeGreaterThan(0);
      expect(container.querySelectorAll("circle").length).toBe(
        animalGlyphOf(animalId).dots.length,
      );
    },
  );

  it("gives every animal its own strokes", () => {
    const strokes = Object.values(AnimalId).map((animalId) =>
      animalGlyphOf(animalId).strokes.join(" "),
    );

    expect(new Set(strokes).size).toBe(strokes.length);
  });

  it("falls back to a leaf for an animal it does not know", () => {
    const { container } = render(<AnimalGlyph animalId="drache" />);

    expect(container.querySelectorAll("path")).toHaveLength(2);
    expect(container.querySelectorAll("circle")).toHaveLength(0);
    expect(animalGlyphOf("drache")).toBe(animalGlyphOf("einhorn"));
  });
});
