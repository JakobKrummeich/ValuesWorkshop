import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { z } from "zod";

const repositoryRoot = resolve(__dirname, "..", "..", "..");

const intentCatalogSchema = z.object({
  stateCallback: z.string(),
  facilitator: z.record(z.string(), z.array(z.string())),
  participant: z.record(z.string(), z.array(z.string())),
});

export type IntentCatalog = z.infer<typeof intentCatalogSchema>;

export function readIntentCatalog(): IntentCatalog {
  return intentCatalogSchema.parse(readContractFile("intents.json"));
}

function readContractFile(...segments: string[]): unknown {
  return JSON.parse(
    readFileSync(resolve(repositoryRoot, "contract", ...segments), "utf8"),
  );
}
