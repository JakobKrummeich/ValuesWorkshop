import { Phase } from "../../../domain/phases";
import type { FacilitatorWorkshopState } from "../../../domain/workshopState";
import { EmptyPhase } from "../../EmptyPhase";
import type { PhaseComponents } from "../../PhaseView";
import { FacilitatorGroupFormationScreen } from "./groupFormation/FacilitatorGroupFormationScreen";
import { FacilitatorGroupWorkScreen } from "./groupWork/FacilitatorGroupWorkScreen";
import { FacilitatorJoinScreen } from "./join/FacilitatorJoinScreen";
import { FacilitatorQuizScreen } from "./quiz/FacilitatorQuizScreen";
import { FacilitatorSelectionScreen } from "./selection/FacilitatorSelectionScreen";
import { FacilitatorSelectionResultsScreen } from "./selectionResults/FacilitatorSelectionResultsScreen";

export const facilitatorPhaseView: PhaseComponents<FacilitatorWorkshopState> = {
  [Phase.Join]: FacilitatorJoinScreen,
  [Phase.Quiz]: FacilitatorQuizScreen,
  [Phase.ValueSelection]: FacilitatorSelectionScreen,
  [Phase.SelectionResults]: FacilitatorSelectionResultsScreen,
  [Phase.GroupFormation]: FacilitatorGroupFormationScreen,
  [Phase.GroupWork]: FacilitatorGroupWorkScreen,
  [Phase.ValuePresentation]: EmptyPhase,
  [Phase.FinalVoting]: EmptyPhase,
  [Phase.FinalPresentation]: EmptyPhase,
};
