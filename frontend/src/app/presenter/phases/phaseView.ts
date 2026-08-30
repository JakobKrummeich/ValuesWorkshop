import { Phase } from "../../../domain/phases";
import type { PresenterWorkshopState } from "../../../domain/workshopState";
import { EmptyPhase } from "../../EmptyPhase";
import type { PhaseComponents } from "../../PhaseView";
import { PresenterFinalVotingScreen } from "./finalVoting/PresenterFinalVotingScreen";
import { PresenterGroupFormationScreen } from "./groupFormation/PresenterGroupFormationScreen";
import { PresenterGroupWorkScreen } from "./groupWork/PresenterGroupWorkScreen";
import { PresenterJoinScreen } from "./join/PresenterJoinScreen";
import { PresenterQuizScreen } from "./quiz/PresenterQuizScreen";
import { PresenterSelectionScreen } from "./selection/PresenterSelectionScreen";
import { PresenterSelectionResultsScreen } from "./selectionResults/PresenterSelectionResultsScreen";
import { PresenterValuePresentationScreen } from "./valuePresentation/PresenterValuePresentationScreen";

export const presenterPhaseView: PhaseComponents<PresenterWorkshopState> = {
  [Phase.Join]: PresenterJoinScreen,
  [Phase.Quiz]: PresenterQuizScreen,
  [Phase.ValueSelection]: PresenterSelectionScreen,
  [Phase.SelectionResults]: PresenterSelectionResultsScreen,
  [Phase.GroupFormation]: PresenterGroupFormationScreen,
  [Phase.GroupWork]: PresenterGroupWorkScreen,
  [Phase.ValuePresentation]: PresenterValuePresentationScreen,
  [Phase.FinalVoting]: PresenterFinalVotingScreen,
  [Phase.FinalPresentation]: EmptyPhase,
};
