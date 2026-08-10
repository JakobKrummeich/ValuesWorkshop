import { z } from "zod";

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
  correctAnswerIndex: z.int().optional(),
  learningText: localizedTextSchema.optional(),
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

export const rosterViewSchema = z.object({
  participants: z.array(
    z.object({
      participantId: participantIdSchema,
      displayName: z.string(),
    }),
  ),
  participantCount: z.int(),
});

const workshopValuesSchema = z.array(
  z.object({
    valueId: z.string(),
    text: localizedTextSchema,
  }),
);

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

export const ownGroupViewSchema = z.object({
  name: z.string(),
  memberCount: z.int(),
  assignedValueIds: valueIdsSchema,
  isCallerScribe: z.boolean(),
  workStatus: z.enum(GroupWorkStatus),
});

export const facilitatorGroupsSchema = z.array(
  z.object({
    name: z.string(),
    memberParticipantIds: z.array(participantIdSchema),
    assignedValueIds: valueIdsSchema,
    scribeParticipantId: participantIdSchema.nullable(),
    workStatus: z.enum(GroupWorkStatus),
  }),
);

export const presenterGroupsSchema = z.array(
  z.object({
    name: z.string(),
    memberCount: z.int(),
    assignedValueIds: valueIdsSchema,
    workStatus: z.enum(GroupWorkStatus),
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
