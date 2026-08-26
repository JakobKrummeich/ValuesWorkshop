import { FormationSubState } from "./workshopStateBlocks";
import type { Phase } from "./phases";
import type {
  FacilitatorWorkshopState,
  ParticipantWorkshopState,
  PresenterWorkshopState,
} from "./workshopStateSchemas";

type InPhase<TState, TPhase extends Phase> = Extract<TState, { phase: TPhase }>;

export type ParticipantJoinState = InPhase<
  ParticipantWorkshopState,
  Phase.Join
>;
export type FacilitatorJoinState = InPhase<
  FacilitatorWorkshopState,
  Phase.Join
>;
export type PresenterJoinState = InPhase<PresenterWorkshopState, Phase.Join>;

export type ParticipantQuizState = InPhase<
  ParticipantWorkshopState,
  Phase.Quiz
>;
export type FacilitatorQuizState = InPhase<
  FacilitatorWorkshopState,
  Phase.Quiz
>;
export type PresenterQuizState = InPhase<PresenterWorkshopState, Phase.Quiz>;

export type ParticipantQuizView = ParticipantQuizState["quiz"];
export type FacilitatorQuizView = FacilitatorQuizState["quiz"];
export type PresenterQuizView = PresenterQuizState["quiz"];

export type ParticipantSelectionState = InPhase<
  ParticipantWorkshopState,
  Phase.ValueSelection
>;
export type FacilitatorSelectionState = InPhase<
  FacilitatorWorkshopState,
  Phase.ValueSelection
>;
export type PresenterSelectionState = InPhase<
  PresenterWorkshopState,
  Phase.ValueSelection
>;

export type OwnSelectionView = ParticipantSelectionState["selection"];

export type ParticipantSelectionResultsState = InPhase<
  ParticipantWorkshopState,
  Phase.SelectionResults
>;
export type FacilitatorSelectionResultsState = InPhase<
  FacilitatorWorkshopState,
  Phase.SelectionResults
>;
export type PresenterSelectionResultsState = InPhase<
  PresenterWorkshopState,
  Phase.SelectionResults
>;

export type ParticipantGroupFormationState = InPhase<
  ParticipantWorkshopState,
  Phase.GroupFormation
>;
export type FacilitatorGroupFormationState = InPhase<
  FacilitatorWorkshopState,
  Phase.GroupFormation
>;
export type PresenterGroupFormationState = InPhase<
  PresenterWorkshopState,
  Phase.GroupFormation
>;

export type ParticipantFormationView =
  ParticipantGroupFormationState["formation"];
export type FacilitatorFormationView =
  FacilitatorGroupFormationState["formation"];
export type PresenterFormationView = PresenterGroupFormationState["formation"];

export type PresenterGroups = Extract<
  PresenterFormationView,
  { subState: FormationSubState.Formed }
>["groups"];

export type ParticipantGroupWorkState = InPhase<
  ParticipantWorkshopState,
  Phase.GroupWork
>;
export type FacilitatorGroupWorkState = InPhase<
  FacilitatorWorkshopState,
  Phase.GroupWork
>;
export type PresenterGroupWorkState = InPhase<
  PresenterWorkshopState,
  Phase.GroupWork
>;

export type FacilitatorGroupWorkGroups = FacilitatorGroupWorkState["groups"];
export type PresenterGroupWorkGroups = PresenterGroupWorkState["groups"];

export type ParticipantValuePresentationState = InPhase<
  ParticipantWorkshopState,
  Phase.ValuePresentation
>;
export type FacilitatorValuePresentationState = InPhase<
  FacilitatorWorkshopState,
  Phase.ValuePresentation
>;
export type PresenterValuePresentationState = InPhase<
  PresenterWorkshopState,
  Phase.ValuePresentation
>;
