import { Phase } from "../../../domain/phases";
import type { ParticipantWorkshopState } from "../../../domain/workshopState";
import type { PhaseComponents } from "../../PhaseView";
import { ParticipantFinalPresentationScreen } from "./finalPresentation/ParticipantFinalPresentationScreen";
import { ParticipantFinalVotingScreen } from "./finalVoting/ParticipantFinalVotingScreen";
import { ParticipantGroupFormationScreen } from "./groupFormation/ParticipantGroupFormationScreen";
import { ParticipantGroupWorkScreen } from "./groupWork/ParticipantGroupWorkScreen";
import { ParticipantJoinScreen } from "./join/ParticipantJoinScreen";
import { ParticipantQuizScreen } from "./quiz/ParticipantQuizScreen";
import { ParticipantSelectionScreen } from "./selection/ParticipantSelectionScreen";
import { ParticipantSelectionResultsScreen } from "./selectionResults/ParticipantSelectionResultsScreen";
import { ParticipantValuePresentationScreen } from "./valuePresentation/ParticipantValuePresentationScreen";

export const participantPhaseView: PhaseComponents<ParticipantWorkshopState> = {
  [Phase.Join]: ParticipantJoinScreen,
  [Phase.Quiz]: ParticipantQuizScreen,
  [Phase.ValueSelection]: ParticipantSelectionScreen,
  [Phase.SelectionResults]: ParticipantSelectionResultsScreen,
  [Phase.GroupFormation]: ParticipantGroupFormationScreen,
  [Phase.GroupWork]: ParticipantGroupWorkScreen,
  [Phase.ValuePresentation]: ParticipantValuePresentationScreen,
  [Phase.FinalVoting]: ParticipantFinalVotingScreen,
  [Phase.FinalPresentation]: ParticipantFinalPresentationScreen,
};
