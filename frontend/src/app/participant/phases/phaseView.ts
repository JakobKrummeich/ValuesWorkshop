import { Phase } from "../../../domain/phases";
import type { ParticipantWorkshopState } from "../../../domain/workshopState";
import { EmptyPhase } from "../../EmptyPhase";
import type { PhaseComponents } from "../../PhaseView";
import { ParticipantJoinScreen } from "./join/ParticipantJoinScreen";
import { ParticipantQuizScreen } from "./quiz/ParticipantQuizScreen";
import { ParticipantSelectionScreen } from "./selection/ParticipantSelectionScreen";
import { ParticipantSelectionResultsScreen } from "./selectionResults/ParticipantSelectionResultsScreen";

export const participantPhaseView: PhaseComponents<ParticipantWorkshopState> = {
  [Phase.Join]: ParticipantJoinScreen,
  [Phase.Quiz]: ParticipantQuizScreen,
  [Phase.ValueSelection]: ParticipantSelectionScreen,
  [Phase.SelectionResults]: ParticipantSelectionResultsScreen,
  [Phase.GroupFormation]: EmptyPhase,
  [Phase.GroupWork]: EmptyPhase,
  [Phase.ValuePresentation]: EmptyPhase,
  [Phase.FinalVoting]: EmptyPhase,
  [Phase.FinalPresentation]: EmptyPhase,
};
