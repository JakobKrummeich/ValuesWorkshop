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
  questionNumber: z.int(),
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

const facilitatorGroupViewSchema = z.object({
  name: z.string(),
  memberParticipantIds: z.array(participantIdSchema),
  assignedValueIds: valueIdsSchema,
  scribeParticipantId: participantIdSchema.nullable(),
  workStatus: z.enum(GroupWorkStatus),
});

const presenterGroupViewSchema = z.object({
  name: z.string(),
  memberCount: z.int(),
  assignedValueIds: valueIdsSchema,
  workStatus: z.enum(GroupWorkStatus),
});

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

const envelopeShape = {
  revision: z.int().nonnegative(),
  phase: z.enum(Phase),
};

export const participantWorkshopStateSchema = z.object({
  ...envelopeShape,
  participantCount: z.int(),
  quiz: quizViewSchema.nullable(),
  selection: ownSelectionViewSchema.nullable(),
  ownGroup: ownGroupViewSchema.nullable(),
  presentation: presentationViewSchema.nullable(),
  voting: votingViewSchema.nullable(),
  conclusion: conclusionViewSchema.nullable(),
});

export const facilitatorWorkshopStateSchema = z.object({
  ...envelopeShape,
  roster: rosterViewSchema,
  quiz: quizViewSchema.nullable(),
  selection: selectionProgressViewSchema.nullable(),
  groups: z.array(facilitatorGroupViewSchema).nullable(),
  presentation: presentationViewSchema.nullable(),
  voting: votingViewSchema.nullable(),
  conclusion: conclusionViewSchema.nullable(),
});

export const presenterWorkshopStateSchema = z.object({
  ...envelopeShape,
  participantCount: z.int(),
  quiz: quizViewSchema.nullable(),
  selection: selectionProgressViewSchema.nullable(),
  groups: z.array(presenterGroupViewSchema).nullable(),
  presentation: presenterPresentationViewSchema.nullable(),
  voting: presenterVotingViewSchema.nullable(),
  conclusion: conclusionViewSchema.nullable(),
});

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
