import { readFileSync } from "node:fs";
import { resolve } from "node:path";
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
});
