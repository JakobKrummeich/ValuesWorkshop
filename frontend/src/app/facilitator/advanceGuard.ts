import { MessageKey } from "../../domain/i18n/messages";
import { Phase } from "../../domain/phases";
import {
  FacilitatorIntent,
  type FacilitatorWorkshopState,
} from "../../domain/workshopState";

const guardWhileBlocked: Readonly<Partial<Record<Phase, MessageKey>>> = {
  [Phase.Quiz]: MessageKey.AdvanceGuardQuiz,
  [Phase.GroupFormation]: MessageKey.AdvanceGuardGroupFormation,
  [Phase.GroupWork]: MessageKey.AdvanceGuardGroupWork,
  [Phase.ValuePresentation]: MessageKey.AdvanceGuardValuePresentation,
  [Phase.FinalVoting]: MessageKey.AdvanceGuardFinalVoting,
};

export function advanceGuardMessageOf(
  state: FacilitatorWorkshopState,
): MessageKey | null {
  if (state.phase === Phase.Join) {
    return MessageKey.AdvanceGuardJoin;
  }

  if (state.phase === Phase.ValueSelection) {
    return state.selection.submittedCount < state.roster.participantCount
      ? MessageKey.AdvanceGuardSelection
      : null;
  }

  const isAdvanceEnabled = state.enabledIntents.includes(
    FacilitatorIntent.AdvancePhase,
  );

  return isAdvanceEnabled ? null : (guardWhileBlocked[state.phase] ?? null);
}
