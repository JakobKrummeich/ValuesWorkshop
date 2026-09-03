import { Phase } from "../../domain/phases";
import {
  FormationSubState,
  type GroupName,
  type ParticipantWorkshopState,
} from "../../domain/workshopState";

const phasesWithoutOwnGroupOnTheWire: ReadonlySet<Phase> = new Set([
  Phase.FinalVoting,
  Phase.FinalPresentation,
]);

export function rememberOwnGroupName(
  remembered: GroupName | null,
  state: ParticipantWorkshopState,
): GroupName | null {
  return phasesWithoutOwnGroupOnTheWire.has(state.phase)
    ? remembered
    : ownGroupNameOf(state);
}

function ownGroupNameOf(state: ParticipantWorkshopState): GroupName | null {
  switch (state.phase) {
    case Phase.GroupFormation:
      return state.formation.subState === FormationSubState.Formed
        ? state.formation.ownGroup.name
        : null;
    case Phase.GroupWork:
    case Phase.ValuePresentation:
      return state.ownGroup === null ? null : state.ownGroup.name;
    default:
      return null;
  }
}
