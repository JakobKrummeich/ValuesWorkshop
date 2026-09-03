const slabTextWidthEm = 22;
const slabColumnHeightEm = 17;
const glyphWidthEm = 0.6;
const lineHeight = 1.25;
const slabChromeEm = 1.4;
const scaleStep = 0.05;
const smallestScale = 0.4;

const scales = Array.from(
  { length: Math.round((1 - smallestScale) / scaleStep) + 1 },
  (unused, index) => Number((1 - index * scaleStep).toFixed(2)),
);

function slabHeightEm(text: string, scale: number): number {
  const lines = Math.ceil(
    (text.length * glyphWidthEm * scale) / slabTextWidthEm,
  );

  return (lines * lineHeight + slabChromeEm) * scale;
}

function columnHeightEm(texts: readonly string[], scale: number): number {
  return texts.reduce((height, text) => height + slabHeightEm(text, scale), 0);
}

export function actionSlabScaleOf(texts: readonly string[]): number {
  return (
    scales.find(
      (scale) => columnHeightEm(texts, scale) <= slabColumnHeightEm,
    ) ?? smallestScale
  );
}
