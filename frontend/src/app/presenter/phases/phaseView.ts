import { Phase } from "../../../domain/phases";
import type { PresenterWorkshopState } from "../../../domain/workshopState";
import { EmptyPhase } from "../../EmptyPhase";
import type { PhaseComponents } from "../../PhaseView";
import { PresenterGroupFormationScreen } from "./groupFormation/PresenterGroupFormationScreen";
import { PresenterJoinScreen } from "./join/PresenterJoinScreen";
import { PresenterQuizScreen } from "./quiz/PresenterQuizScreen";
import { PresenterSelectionScreen } from "./selection/PresenterSelectionScreen";
import { PresenterSelectionResultsScreen } from "./selectionResults/PresenterSelectionResultsScreen";

export const presenterPhaseView: PhaseComponents<PresenterWorkshopState> = {
  [Phase.Join]: PresenterJoinScreen,
  [Phase.Quiz]: PresenterQuizScreen,
  [Phase.ValueSelection]: PresenterSelectionScreen,
  [Phase.SelectionResults]: PresenterSelectionResultsScreen,
  [Phase.GroupFormation]: PresenterGroupFormationScreen,
  [Phase.GroupWork]: EmptyPhase,
  [Phase.ValuePresentation]: EmptyPhase,
  [Phase.FinalVoting]: EmptyPhase,
  [Phase.FinalPresentation]: EmptyPhase,
};
