import { extensionOf } from "../sizeScan.mts";

export interface IndentationComplexity {
  total: number;
  maximumDepth: number;
}

const indentUnitByExtension: Readonly<Record<string, number>> = {
  cs: 4,
  ts: 2,
  tsx: 2,
};

const leadingWhitespace = /^[ \t]*/;

export function indentUnitOf(path: string): number {
  const unit = indentUnitByExtension[extensionOf(path)];
  if (unit === undefined) {
    throw new Error(
      `No indentation unit is known for ${path}; the hotspot analysis measures .${Object.keys(indentUnitByExtension).join(", .")} files.`,
    );
  }
  return unit;
}

function depthOf(line: string, indentUnit: number): number {
  const indentation = leadingWhitespace.exec(line)?.[0] ?? "";
  const tabs = indentation.split("\t").length - 1;
  const spaces = indentation.length - tabs;
  return tabs + spaces / indentUnit;
}

export function measureIndentation(
  fileContent: string,
  indentUnit: number,
): IndentationComplexity {
  const depths = fileContent
    .split("\n")
    .filter((line) => line.trim().length > 0)
    .map((line) => depthOf(line, indentUnit));
  return {
    total: depths.reduce((sum, depth) => sum + depth, 0),
    maximumDepth: depths.reduce(
      (deepest, depth) => Math.max(deepest, depth),
      0,
    ),
  };
}
