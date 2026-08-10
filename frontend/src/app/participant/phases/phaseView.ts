import { Phase } from "../../../domain/phases";
import type { ParticipantWorkshopState } from "../../../domain/workshopState";
import { EmptyPhase } from "../../EmptyPhase";
import type { PhaseComponents } from "../../PhaseView";
import { ParticipantJoinScreen } from "./join/ParticipantJoinScreen";
import { ParticipantQuizScreen } from "./quiz/ParticipantQuizScreen";

export const participantPhaseView: PhaseComponents<ParticipantWorkshopState> = {
  [Phase.Join]: ParticipantJoinScreen,
  [Phase.Quiz]: ParticipantQuizScreen,
  [Phase.ValueSelection]: EmptyPhase,
  [Phase.SelectionResults]: EmptyPhase,
  [Phase.GroupFormation]: EmptyPhase,
  [Phase.GroupWork]: EmptyPhase,
  [Phase.ValuePresentation]: EmptyPhase,
  [Phase.FinalVoting]: EmptyPhase,
  [Phase.FinalPresentation]: EmptyPhase,
};
