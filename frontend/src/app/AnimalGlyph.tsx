import styles from "./AnimalGlyph.module.css";
import { animalGlyphOf } from "./animalGlyphs";

export function AnimalGlyph({ animalId }: { animalId: string }) {
  const glyph = animalGlyphOf(animalId);

  return (
    <svg
      className={styles.glyph}
      viewBox="0 0 32 32"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {glyph.strokes.map((stroke) => (
        <path key={stroke} d={stroke} pathLength={1} />
      ))}
      {glyph.dots.map((dot) => (
        <circle
          key={`${dot.x},${dot.y}`}
          cx={dot.x}
          cy={dot.y}
          r={dot.radius}
          fill="currentColor"
          stroke="none"
        />
      ))}
    </svg>
  );
}
