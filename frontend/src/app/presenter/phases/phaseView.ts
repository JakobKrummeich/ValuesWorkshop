import { Phase } from "../../../domain/phases";
import type { PresenterWorkshopState } from "../../../domain/workshopState";
import { EmptyPhase } from "../../EmptyPhase";
import type { PhaseComponents } from "../../PhaseView";
import { PresenterJoinScreen } from "./join/PresenterJoinScreen";
import { PresenterQuizScreen } from "./quiz/PresenterQuizScreen";
import { PresenterSelectionScreen } from "./selection/PresenterSelectionScreen";

export const presenterPhaseView: PhaseComponents<PresenterWorkshopState> = {
  [Phase.Join]: PresenterJoinScreen,
  [Phase.Quiz]: PresenterQuizScreen,
  [Phase.ValueSelection]: PresenterSelectionScreen,
  [Phase.SelectionResults]: EmptyPhase,
  [Phase.GroupFormation]: EmptyPhase,
  [Phase.GroupWork]: EmptyPhase,
  [Phase.ValuePresentation]: EmptyPhase,
  [Phase.FinalVoting]: EmptyPhase,
  [Phase.FinalPresentation]: EmptyPhase,
};
