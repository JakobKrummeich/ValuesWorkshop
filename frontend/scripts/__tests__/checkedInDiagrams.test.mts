import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { readMarkedRegion } from "../quality/markedRegion.mts";
import {
  diagramRegionOf,
  mermaidFence,
  readmePath,
} from "../quality/readmeEngineering.mts";
import { generateStructuralDiagrams } from "../quality/structuralDiagrams.mts";

const repositoryRoot = resolve(__dirname, "../../..");

describe("the checked-in diagrams the frontend generates", () => {
  const diagrams = generateStructuralDiagrams({
    repositoryRoot,
    frontendDirectory: resolve(repositoryRoot, "frontend"),
  });

  it.each(diagrams)(
    "$path says what the generator says — refresh it with `pnpm quality:report`",
    ({ path, mermaid }) => {
      expect(readFileSync(resolve(repositoryRoot, path), "utf8")).toBe(mermaid);
    },
  );

  it.each(diagrams)(
    "the README shows $path verbatim — refresh it with `pnpm quality:report`",
    ({ path, mermaid }) => {
      const readme = readFileSync(resolve(repositoryRoot, readmePath), "utf8");
      expect(readMarkedRegion(readme, diagramRegionOf(path))).toBe(
        mermaidFence(mermaid),
      );
    },
  );
});
