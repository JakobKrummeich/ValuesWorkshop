import { z } from "zod";
import { Phase } from "./phases";
import {
  conclusionViewSchema,
  facilitatorGroupsSchema,
  facilitatorQuizViewSchema,
  ownGroupViewSchema,
  ownSelectionViewSchema,
  participantQuizViewSchema,
  presentationViewSchema,
  presenterGroupsSchema,
  presenterPresentationViewSchema,
  presenterQuizViewSchema,
  presenterVotingViewSchema,
  rosterViewSchema,
  selectionProgressViewSchema,
  votingViewSchema,
} from "./workshopStateBlocks";

export { GroupWorkStatus, QuizSubState } from "./workshopStateBlocks";

export enum FacilitatorIntent {
  AdvancePhase = "AdvancePhase",
  RevealAnswer = "RevealAnswer",
  ShowLearningText = "ShowLearningText",
  PoseNextQuestion = "PoseNextQuestion",
}

export enum ParticipantIntent {
  ChooseQuizAnswer = "ChooseQuizAnswer",
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
    ownGroup: ownGroupViewSchema.nullable(),
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
    groups: facilitatorGroupsSchema,
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
    groups: presenterGroupsSchema,
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
