import { z } from "zod";
import { Phase } from "./phases";

export enum QuizSubState {
  Answering = 1,
  Revealed = 2,
  LearningTextShown = 3,
}

export enum GroupWorkStatus {
  Editing = 1,
  Submitted = 2,
}

const valueIdsSchema = z.array(z.string());
const participantIdSchema = z.string();

const quizViewSchema = z.object({
  questionIndex: z.int().nullable(),
  subState: z.enum(QuizSubState),
});

const rosterViewSchema = z.object({
  participantIds: z.array(participantIdSchema),
  participantCount: z.int(),
});

const ownSelectionViewSchema = z.object({
  isOwnSubmitted: z.boolean(),
  topValueIds: valueIdsSchema,
});

const selectionProgressViewSchema = z.object({
  submittedCount: z.int(),
  topValueIds: valueIdsSchema,
});

const ownGroupViewSchema = z.object({
  name: z.string(),
  memberCount: z.int(),
  assignedValueIds: valueIdsSchema,
  isCallerScribe: z.boolean(),
  workStatus: z.enum(GroupWorkStatus),
});

const facilitatorGroupsSchema = z.array(
  z.object({
    name: z.string(),
    memberParticipantIds: z.array(participantIdSchema),
    assignedValueIds: valueIdsSchema,
    scribeParticipantId: participantIdSchema.nullable(),
    workStatus: z.enum(GroupWorkStatus),
  }),
);

const presenterGroupsSchema = z.array(
  z.object({
    name: z.string(),
    memberCount: z.int(),
    assignedValueIds: valueIdsSchema,
    workStatus: z.enum(GroupWorkStatus),
  }),
);

const presentationViewSchema = z.object({
  presentingGroupName: z.string().nullable(),
  presentedValueId: z.string().nullable(),
});

const presenterPresentationViewSchema = z.object({
  presentedValueId: z.string().nullable(),
});

const votingViewSchema = z.object({
  roundNumber: z.int(),
  isRoundOpen: z.boolean(),
});

const presenterVotingViewSchema = z.object({
  isRoundOpen: z.boolean(),
});

const conclusionViewSchema = z.object({
  winningValueIds: valueIdsSchema,
});

const revisionSchema = z.int().nonnegative();

const participantEnvelope = {
  revision: revisionSchema,
  participantCount: z.int(),
};

const facilitatorEnvelope = {
  revision: revisionSchema,
  roster: rosterViewSchema,
};

const presenterEnvelope = participantEnvelope;

export const participantWorkshopStateSchema = z.discriminatedUnion("phase", [
  z.object({ phase: z.literal(Phase.Join), ...participantEnvelope }),
  z.object({
    phase: z.literal(Phase.Quiz),
    ...participantEnvelope,
    quiz: quizViewSchema,
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
    quiz: quizViewSchema,
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
  z.object({ phase: z.literal(Phase.Join), ...presenterEnvelope }),
  z.object({
    phase: z.literal(Phase.Quiz),
    ...presenterEnvelope,
    quiz: quizViewSchema,
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
