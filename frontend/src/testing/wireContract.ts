import { readdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { z } from "zod";

const repositoryRoot = resolve(__dirname, "..", "..", "..");

const intentCatalogSchema = z.object({
  stateCallback: z.string(),
  facilitator: z.record(z.string(), z.array(z.string())),
  participant: z.record(z.string(), z.array(z.string())),
});

const enumCatalogSchema = z.record(
  z.string(),
  z.record(z.string(), z.union([z.string(), z.number()])),
);

type IntentCatalog = z.infer<typeof intentCatalogSchema>;
type EnumCatalog = z.infer<typeof enumCatalogSchema>;

export function readIntentCatalog(): IntentCatalog {
  return intentCatalogSchema.parse(readContractFile("intents.json"));
}

export function readEnumCatalog(): EnumCatalog {
  return enumCatalogSchema.parse(readContractFile("enums.json"));
}

export function readStateFixtures(
  role: string,
): { name: string; state: unknown }[] {
  const directory = resolve(repositoryRoot, "contract", "state", role);

  return readdirSync(directory)
    .map((fileName) => fileName.replace(/\.json$/, ""))
    .sort()
    .map((name) => ({
      name,
      state: readContractFile("state", role, `${name}.json`),
    }));
}

function readContractFile(...segments: string[]): unknown {
  return JSON.parse(
    readFileSync(resolve(repositoryRoot, "contract", ...segments), "utf8"),
  );
}
