export enum AnimalId {
  Otter = "otter",
  Fuchs = "fuchs",
  Eule = "eule",
  Igel = "igel",
  Dachs = "dachs",
  Luchs = "luchs",
  Biber = "biber",
  Marder = "marder",
}

export interface GlyphDot {
  readonly x: number;
  readonly y: number;
  readonly radius: number;
}

export interface AnimalGlyphStrokes {
  readonly strokes: readonly string[];
  readonly dots: readonly GlyphDot[];
}

function circle(x: number, y: number, radius: number): string {
  const diameter = radius * 2;

  return `M${x - radius} ${y}a${radius} ${radius} 0 1 0 ${diameter} 0a${radius} ${radius} 0 1 0-${diameter} 0`;
}

const animalGlyphs: Readonly<Record<AnimalId, AnimalGlyphStrokes>> = {
  [AnimalId.Otter]: {
    strokes: [
      circle(16, 16, 10),
      circle(8, 8, 2.5),
      circle(24, 8, 2.5),
      "M13 21.5q3 2.5 6 0",
      "M2 18l4 1M2 23l4-1M30 18l-4 1M30 23l-4-1",
    ],
    dots: [
      { x: 12.5, y: 14.5, radius: 1.2 },
      { x: 19.5, y: 14.5, radius: 1.2 },
      { x: 16, y: 18.5, radius: 1.6 },
    ],
  },
  [AnimalId.Fuchs]: {
    strokes: ["M5 4l8 7 3-1 3 1 8-7-1.5 15L16 29 6.5 19z", "M13 23q3 3 6 0"],
    dots: [
      { x: 12.5, y: 16, radius: 1.2 },
      { x: 19.5, y: 16, radius: 1.2 },
      { x: 16, y: 22, radius: 1.4 },
    ],
  },
  [AnimalId.Eule]: {
    strokes: [
      "M8 9l2-5 3 4M24 9l-2-5-3 4",
      "M6 17a10 11 0 1 0 20 0a10 11 0 1 0-20 0",
      circle(12, 14, 3),
      circle(20, 14, 3),
      "M14.5 19.5l1.5 2.5 1.5-2.5",
    ],
    dots: [
      { x: 12, y: 14, radius: 1.1 },
      { x: 20, y: 14, radius: 1.1 },
    ],
  },
  [AnimalId.Igel]: {
    strokes: [
      "M4 24C4 14 9 9 16 9c5 0 9 3 11 8l3 7z",
      "M8 12L5 8M12 9.5L10 5M16.5 9V4M21 10l2-4.5M25 13l3.5-3",
    ],
    dots: [
      { x: 22, y: 18, radius: 1.2 },
      { x: 29.5, y: 23.5, radius: 1.5 },
    ],
  },
  [AnimalId.Dachs]: {
    strokes: [
      "M16 5C8.5 5 5 10.5 5 16.5S8.5 28 16 28s11-5.5 11-11.5S23.5 5 16 5z",
      "M12 8.5V12M12 18.5v7M20 8.5V12M20 18.5v7",
      circle(8.5, 7.5, 2),
      circle(23.5, 7.5, 2),
    ],
    dots: [
      { x: 12, y: 15.25, radius: 1.5 },
      { x: 20, y: 15.25, radius: 1.5 },
      { x: 16, y: 23, radius: 1.6 },
    ],
  },
  [AnimalId.Luchs]: {
    strokes: [
      "M7 7l4 5h10l4-5 2 4c1 9-3 17-11 17S4 20 5 11z",
      "M7 7L5.5 2M25 7l1.5-5",
      "M11 15l2.5 2M21 15l-2.5 2",
      "M5 22l-3 2M27 22l3 2",
    ],
    dots: [{ x: 16, y: 22, radius: 1.3 }],
  },
  [AnimalId.Biber]: {
    strokes: [
      circle(16, 15.5, 10.5),
      circle(7.5, 7, 2.2),
      circle(24.5, 7, 2.2),
      "M13.5 21v5h5v-5M16 21v5",
    ],
    dots: [
      { x: 12, y: 13, radius: 1.2 },
      { x: 20, y: 13, radius: 1.2 },
      { x: 16, y: 17.5, radius: 1.6 },
    ],
  },
  [AnimalId.Marder]: {
    strokes: [
      "M6 8c0-4 5-4 6 0 2-1 6-1 8 0 1-4 6-4 6 0 1 7-2 13-10 20C8 21 5 15 6 8z",
      "M13 24q3 2 6 0",
    ],
    dots: [
      { x: 12, y: 14, radius: 1.2 },
      { x: 20, y: 14, radius: 1.2 },
      { x: 16, y: 21, radius: 1.5 },
    ],
  },
};

const leafGlyph: AnimalGlyphStrokes = {
  strokes: ["M6 26C6 14 14 6 26 6c0 12-8 20-20 20z", "M6 26L20 12"],
  dots: [],
};

function isAnimalId(animalId: string): animalId is AnimalId {
  return Object.values<string>(AnimalId).includes(animalId);
}

export function animalGlyphOf(animalId: string): AnimalGlyphStrokes {
  return isAnimalId(animalId) ? animalGlyphs[animalId] : leafGlyph;
}
