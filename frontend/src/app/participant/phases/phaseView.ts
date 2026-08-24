import { Phase } from "../../../domain/phases";
import type { ParticipantWorkshopState } from "../../../domain/workshopState";
import { EmptyPhase } from "../../EmptyPhase";
import type { PhaseComponents } from "../../PhaseView";
import { WaitingScreen } from "../../WaitingScreen";
import { ParticipantGroupFormationScreen } from "./groupFormation/ParticipantGroupFormationScreen";
import { ParticipantGroupWorkScreen } from "./groupWork/ParticipantGroupWorkScreen";
import { ParticipantJoinScreen } from "./join/ParticipantJoinScreen";
import { ParticipantQuizScreen } from "./quiz/ParticipantQuizScreen";
import { ParticipantSelectionScreen } from "./selection/ParticipantSelectionScreen";

export const participantPhaseView: PhaseComponents<ParticipantWorkshopState> = {
  [Phase.Join]: ParticipantJoinScreen,
  [Phase.Quiz]: ParticipantQuizScreen,
  [Phase.ValueSelection]: ParticipantSelectionScreen,
  [Phase.SelectionResults]: WaitingScreen,
  [Phase.GroupFormation]: ParticipantGroupFormationScreen,
  [Phase.GroupWork]: ParticipantGroupWorkScreen,
  [Phase.ValuePresentation]: EmptyPhase,
  [Phase.FinalVoting]: EmptyPhase,
  [Phase.FinalPresentation]: EmptyPhase,
};
