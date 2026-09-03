import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { ActionLedgerVariant } from "../ActionLedger";
import { ConnectionStatusVariant } from "../chrome/ConnectionStatus";
import { PhaseStepperVariant } from "../chrome/PhaseStepper";
import { PhaseStepState } from "../chrome/usePhaseStepper";
import { WordmarkSize } from "../chrome/Wordmark";
import { CounterSize, CounterVariant } from "../Counter";
import { EyebrowTone } from "../Eyebrow";
import { GroupCardVariant } from "../GroupCard";
import { AnswerBarEmphasis } from "../presenter/phases/quiz/usePresenterQuizScreen";

const variantModules: ReadonlyArray<
  [moduleFile: string, variants: Readonly<Record<string, string>>]
> = [
  ["ActionLedger.module.css", ActionLedgerVariant],
  ["Counter.module.css", CounterSize],
  ["Counter.module.css", CounterVariant],
  ["Eyebrow.module.css", EyebrowTone],
  ["GroupCard.module.css", GroupCardVariant],
  ["chrome/ConnectionStatus.module.css", ConnectionStatusVariant],
  ["chrome/PhaseStepMarker.module.css", PhaseStepState],
  ["chrome/PhaseStepper.module.css", PhaseStepperVariant],
  ["chrome/PhaseStepper.module.css", PhaseStepState],
  ["chrome/Wordmark.module.css", WordmarkSize],
  ["presenter/phases/quiz/QuizAnswerRow.module.css", AnswerBarEmphasis],
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
