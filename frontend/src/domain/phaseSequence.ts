import { Phase } from "./phases";

export const phaseSequence: readonly Phase[] = [
  Phase.Join,
  Phase.Quiz,
  Phase.ValueSelection,
  Phase.SelectionResults,
  Phase.GroupFormation,
  Phase.GroupWork,
  Phase.ValuePresentation,
  Phase.FinalVoting,
  Phase.FinalPresentation,
];

export function nextPhase(phase: Phase): Phase | null {
  return phaseSequence[phaseSequence.indexOf(phase) + 1] ?? null;
}
