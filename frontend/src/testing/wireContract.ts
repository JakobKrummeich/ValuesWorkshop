import { readFileSync } from "node:fs";
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

export type IntentCatalog = z.infer<typeof intentCatalogSchema>;
export type EnumCatalog = z.infer<typeof enumCatalogSchema>;

export function readIntentCatalog(): IntentCatalog {
  return intentCatalogSchema.parse(readContractFile("intents.json"));
}

export function readEnumCatalog(): EnumCatalog {
  return enumCatalogSchema.parse(readContractFile("enums.json"));
}

function readContractFile(...segments: string[]): unknown {
  return JSON.parse(
    readFileSync(resolve(repositoryRoot, "contract", ...segments), "utf8"),
  );
}
