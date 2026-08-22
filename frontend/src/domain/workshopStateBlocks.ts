import { z } from "zod";

export enum QuizSubState {
  Answering = 1,
  Revealed = 2,
  LearningTextShown = 3,
}

const valueIdsSchema = z.array(z.string());
const participantIdSchema = z.string();

const localizedTextSchema = z.object({
  de: z.string(),
  en: z.string(),
});

const quizViewBase = {
  questionIndex: z.int().nonnegative(),
  questionCount: z.int().positive(),
  subState: z.enum(QuizSubState),
  question: localizedTextSchema,
  answers: z.array(localizedTextSchema),
};

export const participantQuizViewSchema = z.object({
  ...quizViewBase,
  ownAnswerIndex: z.int().nullable(),
});

export const facilitatorQuizViewSchema = z.object({
  ...quizViewBase,
  answerTallies: z.array(z.int()),
  answeredCount: z.int(),
  correctAnswerIndex: z.int(),
  learningText: localizedTextSchema,
});

export const presenterQuizViewSchema = z.object({
  ...quizViewBase,
  answerTallies: z.array(z.int()),
  correctAnswerIndex: z.int().optional(),
  learningText: localizedTextSchema.optional(),
});

const rosterParticipantSchema = z.object({
  participantId: participantIdSchema,
  displayName: z.string(),
});

export const rosterViewSchema = z.object({
  participants: z.array(rosterParticipantSchema),
  participantCount: z.int(),
});

const workshopValueSchema = z.object({
  valueId: z.string(),
  text: localizedTextSchema,
});

const workshopValuesSchema = z.array(workshopValueSchema);

export type WorkshopValue = z.infer<typeof workshopValueSchema>;

const selectionTalliesSchema = z.record(z.string(), z.int());

export const ownSelectionViewSchema = z.object({
  values: workshopValuesSchema,
  ownSelectedValueIds: valueIdsSchema,
  isSubmitted: z.boolean(),
  selectionTallies: selectionTalliesSchema.optional(),
  topValueIds: valueIdsSchema.optional(),
});

export const selectionProgressViewSchema = z.object({
  values: workshopValuesSchema,
  submittedCount: z.int(),
  selectionTallies: selectionTalliesSchema.optional(),
  topValueIds: valueIdsSchema.optional(),
});

const groupNameSchema = z.object({
  animalId: z.string(),
  text: localizedTextSchema,
});

export type GroupName = z.infer<typeof groupNameSchema>;

export const ownGroupViewSchema = z.object({
  name: groupNameSchema,
  memberDisplayNames: z.array(z.string()),
  assignedValues: workshopValuesSchema,
});

export const facilitatorGroupsSchema = z.array(
  z.object({
    name: groupNameSchema,
    members: z.array(rosterParticipantSchema),
    assignedValues: workshopValuesSchema,
  }),
);

export const presenterGroupsSchema = z.array(
  z.object({
    name: groupNameSchema,
    memberDisplayNames: z.array(z.string()),
    assignedValues: workshopValuesSchema,
  }),
);

export const presentationViewSchema = z.object({
  presentingGroupName: z.string().nullable(),
  presentedValueId: z.string().nullable(),
});

export const presenterPresentationViewSchema = z.object({
  presentedValueId: z.string().nullable(),
});

export const votingViewSchema = z.object({
  roundNumber: z.int(),
  isRoundOpen: z.boolean(),
});

export const presenterVotingViewSchema = z.object({
  isRoundOpen: z.boolean(),
});

export const conclusionViewSchema = z.object({
  winningValueIds: valueIdsSchema,
});
