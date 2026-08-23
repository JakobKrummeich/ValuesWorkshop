import { z } from "zod";
import { Phase } from "./phases";
import {
  conclusionViewSchema,
  facilitatorFormationViewSchema,
  facilitatorGroupsSchema,
  facilitatorQuizViewSchema,
  ownGroupViewSchema,
  participantFormationViewSchema,
  ownSelectionViewSchema,
  participantQuizViewSchema,
  presentationViewSchema,
  presenterFormationViewSchema,
  presenterGroupsSchema,
  presenterPresentationViewSchema,
  presenterQuizViewSchema,
  presenterVotingViewSchema,
  rosterViewSchema,
  selectionProgressViewSchema,
  votingViewSchema,
} from "./workshopStateBlocks";

import { FormationSubState } from "./workshopStateBlocks";

export { FormationSubState, QuizSubState } from "./workshopStateBlocks";
export type { GroupName, WorkshopValue } from "./workshopStateBlocks";

export enum FacilitatorIntent {
  AdvancePhase = "AdvancePhase",
  RevealAnswer = "RevealAnswer",
  ShowLearningText = "ShowLearningText",
  PoseNextQuestion = "PoseNextQuestion",
  ReassignScribe = "ReassignScribe",
}

export enum ParticipantIntent {
  ChooseQuizAnswer = "ChooseQuizAnswer",
  SubmitValueSelection = "SubmitValueSelection",
}

const revisionSchema = z.int().nonnegative();

const participantEnvelope = {
  revision: revisionSchema,
  participantCount: z.int(),
};

const facilitatorEnvelope = {
  revision: revisionSchema,
  roster: rosterViewSchema,
  enabledIntents: z.array(z.enum(FacilitatorIntent)),
};

const presenterEnvelope = participantEnvelope;

export const participantWorkshopStateSchema = z.discriminatedUnion("phase", [
  z.object({
    phase: z.literal(Phase.Join),
    ...participantEnvelope,
    ownDisplayName: z.string(),
  }),
  z.object({
    phase: z.literal(Phase.Quiz),
    ...participantEnvelope,
    quiz: participantQuizViewSchema,
  }),
  z.object({
    phase: z.literal(Phase.ValueSelection),
    ...participantEnvelope,
    selection: ownSelectionViewSchema,
  }),
  z.object({
    phase: z.literal(Phase.SelectionResults),
    ...participantEnvelope,
    selection: ownSelectionViewSchema,
  }),
  z.object({
    phase: z.literal(Phase.GroupFormation),
    ...participantEnvelope,
    formation: participantFormationViewSchema,
  }),
  z.object({
    phase: z.literal(Phase.GroupWork),
    ...participantEnvelope,
    ownGroup: ownGroupViewSchema.nullable(),
  }),
  z.object({
    phase: z.literal(Phase.ValuePresentation),
    ...participantEnvelope,
    ownGroup: ownGroupViewSchema.nullable(),
    presentation: presentationViewSchema,
  }),
  z.object({
    phase: z.literal(Phase.FinalVoting),
    ...participantEnvelope,
    voting: votingViewSchema,
  }),
  z.object({
    phase: z.literal(Phase.FinalPresentation),
    ...participantEnvelope,
    conclusion: conclusionViewSchema,
  }),
]);

export const facilitatorWorkshopStateSchema = z.discriminatedUnion("phase", [
  z.object({ phase: z.literal(Phase.Join), ...facilitatorEnvelope }),
  z.object({
    phase: z.literal(Phase.Quiz),
    ...facilitatorEnvelope,
    quiz: facilitatorQuizViewSchema,
  }),
  z.object({
    phase: z.literal(Phase.ValueSelection),
    ...facilitatorEnvelope,
    selection: selectionProgressViewSchema,
  }),
  z.object({
    phase: z.literal(Phase.SelectionResults),
    ...facilitatorEnvelope,
    selection: selectionProgressViewSchema,
  }),
  z.object({
    phase: z.literal(Phase.GroupFormation),
    ...facilitatorEnvelope,
    selection: selectionProgressViewSchema,
    formation: facilitatorFormationViewSchema,
  }),
  z.object({
    phase: z.literal(Phase.GroupWork),
    ...facilitatorEnvelope,
    groups: facilitatorGroupsSchema,
  }),
  z.object({
    phase: z.literal(Phase.ValuePresentation),
    ...facilitatorEnvelope,
    groups: facilitatorGroupsSchema,
    presentation: presentationViewSchema,
  }),
  z.object({
    phase: z.literal(Phase.FinalVoting),
    ...facilitatorEnvelope,
    voting: votingViewSchema,
  }),
  z.object({
    phase: z.literal(Phase.FinalPresentation),
    ...facilitatorEnvelope,
    conclusion: conclusionViewSchema,
  }),
]);

export const presenterWorkshopStateSchema = z.discriminatedUnion("phase", [
  z.object({
    phase: z.literal(Phase.Join),
    ...presenterEnvelope,
    participantDisplayNames: z.array(z.string()),
  }),
  z.object({
    phase: z.literal(Phase.Quiz),
    ...presenterEnvelope,
    quiz: presenterQuizViewSchema,
  }),
  z.object({
    phase: z.literal(Phase.ValueSelection),
    ...presenterEnvelope,
    selection: selectionProgressViewSchema,
  }),
  z.object({
    phase: z.literal(Phase.SelectionResults),
    ...presenterEnvelope,
    selection: selectionProgressViewSchema,
  }),
  z.object({
    phase: z.literal(Phase.GroupFormation),
    ...presenterEnvelope,
    selection: selectionProgressViewSchema,
    formation: presenterFormationViewSchema,
  }),
  z.object({
    phase: z.literal(Phase.GroupWork),
    ...presenterEnvelope,
    groups: presenterGroupsSchema,
  }),
  z.object({
    phase: z.literal(Phase.ValuePresentation),
    ...presenterEnvelope,
    groups: presenterGroupsSchema,
    presentation: presenterPresentationViewSchema,
  }),
  z.object({
    phase: z.literal(Phase.FinalVoting),
    ...presenterEnvelope,
    voting: presenterVotingViewSchema,
  }),
  z.object({
    phase: z.literal(Phase.FinalPresentation),
    ...presenterEnvelope,
    conclusion: conclusionViewSchema,
  }),
]);

export interface PhasedWorkshopState {
  revision: number;
  phase: Phase;
}

export type ParticipantWorkshopState = z.infer<
  typeof participantWorkshopStateSchema
>;
export type FacilitatorWorkshopState = z.infer<
  typeof facilitatorWorkshopStateSchema
>;
export type PresenterWorkshopState = z.infer<
  typeof presenterWorkshopStateSchema
>;

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

type InSubState<TFormation, TSubState extends FormationSubState> = Extract<
  TFormation,
  { subState: TSubState }
>;

export type ParticipantFormationView =
  ParticipantGroupFormationState["formation"];
export type FacilitatorFormationView =
  FacilitatorGroupFormationState["formation"];
export type PresenterFormationView = PresenterGroupFormationState["formation"];

export type FacilitatorGroups = InSubState<
  FacilitatorFormationView,
  FormationSubState.Formed
>["groups"];
export type PresenterGroups = InSubState<
  PresenterFormationView,
  FormationSubState.Formed
>["groups"];
