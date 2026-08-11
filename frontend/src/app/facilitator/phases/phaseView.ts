import { Phase } from "../../../domain/phases";
import type { FacilitatorWorkshopState } from "../../../domain/workshopState";
import { EmptyPhase } from "../../EmptyPhase";
import type { PhaseComponents } from "../../PhaseView";
import { FacilitatorJoinScreen } from "./join/FacilitatorJoinScreen";
import { FacilitatorQuizScreen } from "./quiz/FacilitatorQuizScreen";
import { FacilitatorSelectionScreen } from "./selection/FacilitatorSelectionScreen";

export const facilitatorPhaseView: PhaseComponents<FacilitatorWorkshopState> = {
  [Phase.Join]: FacilitatorJoinScreen,
  [Phase.Quiz]: FacilitatorQuizScreen,
  [Phase.ValueSelection]: FacilitatorSelectionScreen,
  [Phase.SelectionResults]: EmptyPhase,
  [Phase.GroupFormation]: EmptyPhase,
  [Phase.GroupWork]: EmptyPhase,
  [Phase.ValuePresentation]: EmptyPhase,
  [Phase.FinalVoting]: EmptyPhase,
  [Phase.FinalPresentation]: EmptyPhase,
};
