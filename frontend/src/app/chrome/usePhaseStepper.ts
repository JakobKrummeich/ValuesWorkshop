"use client";

import { MessageKey } from "../../domain/i18n/messages";
import { phaseNameKey } from "../../domain/i18n/phaseNameKey";
import { phaseSequence } from "../../domain/phaseSequence";
import type { Phase } from "../../domain/phases";
import { useTranslation } from "../i18n/useTranslation";

export enum PhaseStepState {
  Done = "done",
  Current = "current",
  Upcoming = "upcoming",
}

export interface PhaseStep {
  phase: Phase;
  number: number;
  name: string;
  state: PhaseStepState;
}

export interface PhaseStepperResult {
  label: string;
  steps: readonly PhaseStep[];
  currentLabel: string;
  currentName: string | null;
}

function stateOf(index: number, currentIndex: number): PhaseStepState {
  if (index === currentIndex) {
    return PhaseStepState.Current;
  }

  return index < currentIndex ? PhaseStepState.Done : PhaseStepState.Upcoming;
}

export function usePhaseStepper(
  currentPhase: Phase | null,
): PhaseStepperResult {
  const { translate } = useTranslation();
  const currentIndex =
    currentPhase === null ? -1 : phaseSequence.indexOf(currentPhase);
  const steps = phaseSequence.map((phase, index) => ({
    phase,
    number: index + 1,
    name: translate(phaseNameKey(phase)),
    state: stateOf(index, currentIndex),
  }));

  return {
    label: translate(MessageKey.PhaseStepperLabel),
    steps,
    currentLabel:
      currentPhase === null
        ? translate(MessageKey.SessionWaiting)
        : translate(MessageKey.SessionPhase, { phase: currentPhase }),
    currentName: steps[currentIndex]?.name ?? null,
  };
}
