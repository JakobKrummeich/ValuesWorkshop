import { Phase } from "../phases";
import { MessageKey } from "./messages";

const phaseNameKeys: Readonly<Record<Phase, MessageKey>> = {
  [Phase.Join]: MessageKey.PhaseNameJoin,
  [Phase.Quiz]: MessageKey.PhaseNameQuiz,
  [Phase.ValueSelection]: MessageKey.PhaseNameValueSelection,
  [Phase.SelectionResults]: MessageKey.PhaseNameSelectionResults,
  [Phase.GroupFormation]: MessageKey.PhaseNameGroupFormation,
  [Phase.GroupWork]: MessageKey.PhaseNameGroupWork,
  [Phase.ValuePresentation]: MessageKey.PhaseNameValuePresentation,
  [Phase.FinalVoting]: MessageKey.PhaseNameFinalVoting,
  [Phase.FinalPresentation]: MessageKey.PhaseNameFinalPresentation,
};

export function phaseNameKey(phase: Phase): MessageKey {
  return phaseNameKeys[phase];
}
