import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { ActionLedgerVariant } from "../ActionLedger";
import { ConnectionStatusVariant } from "../chrome/ConnectionStatus";
import { PhaseStepperVariant } from "../chrome/PhaseStepper";
import { PhaseStepState } from "../chrome/usePhaseStepper";
import { WordmarkSize } from "../chrome/Wordmark";
import { CounterVariant } from "../Counter";
import { GroupCardVariant } from "../GroupCard";

const variantModules: ReadonlyArray<
  [moduleFile: string, variants: Readonly<Record<string, string>>]
> = [
  ["ActionLedger.module.css", ActionLedgerVariant],
  ["Counter.module.css", CounterVariant],
  ["GroupCard.module.css", GroupCardVariant],
  ["chrome/ConnectionStatus.module.css", ConnectionStatusVariant],
  ["chrome/PhaseStepMarker.module.css", PhaseStepState],
  ["chrome/PhaseStepper.module.css", PhaseStepperVariant],
  ["chrome/PhaseStepper.module.css", PhaseStepState],
  ["chrome/Wordmark.module.css", WordmarkSize],
];

function classNamesOf(moduleFile: string): ReadonlySet<string> {
  const source = readFileSync(resolve(__dirname, "..", moduleFile), "utf8");

  return new Set(
    [...source.matchAll(/\.([a-z][a-zA-Z0-9]*)/g)].map(([, name]) => name),
  );
}

describe.each(variantModules)(
  "%s defines a class for every variant it is handed",
  (moduleFile, variants) => {
    it.each(Object.values(variants))("styles %s", (variant) => {
      expect(classNamesOf(moduleFile)).toContain(variant);
    });
  },
);
