import { z } from "zod";

export enum QuizSubState {
  Answering = 1,
  Revealed = 2,
  LearningTextShown = 3,
}

export enum FormationSubState {
  Forming = "forming",
  Formed = "formed",
}

export enum GroupWorkStatus {
  Editing = "editing",
  Submitted = "submitted",
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

export const participantQuizViewSchema = z
  .object({
    ...quizViewBase,
    ownAnswerIndex: z.int().nonnegative().nullable(),
  })
  .refine(
    ({ ownAnswerIndex, answers }) =>
      ownAnswerIndex === null || ownAnswerIndex < answers.length,
    {
      error: "The own answer index must point at one of the posed answers.",
      path: ["ownAnswerIndex"],
    },
  );

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

const groupActionViewSchema = z.object({
  actionId: z.string(),
  valueId: z.string(),
  text: z.string(),
  sortOrder: z.int().nonnegative(),
});

export type GroupActionView = z.infer<typeof groupActionViewSchema>;

export const ownGroupViewSchema = z.object({
  name: groupNameSchema,
  memberDisplayNames: z.array(z.string()),
  assignedValues: workshopValuesSchema,
  isCallerScribe: z.boolean().optional(),
  scribeName: z.string().optional(),
  workStatus: z.enum(GroupWorkStatus).optional(),
  actions: z.array(groupActionViewSchema).optional(),
});

export type OwnGroupView = z.infer<typeof ownGroupViewSchema>;

export const facilitatorGroupsSchema = z.array(
  z.object({
    name: groupNameSchema,
    members: z.array(rosterParticipantSchema),
    assignedValues: workshopValuesSchema,
    scribeParticipantId: z.string().optional(),
    workStatus: z.enum(GroupWorkStatus).optional(),
    actionCountPerValue: z.record(z.string(), z.int()).optional(),
  }),
);

export const presenterGroupsSchema = z.array(
  z.object({
    name: groupNameSchema,
    memberDisplayNames: z.array(z.string()),
    assignedValues: workshopValuesSchema,
    workStatus: z.enum(GroupWorkStatus).optional(),
  }),
);

const formationProgressSchema = z.object({
  subState: z.literal(FormationSubState.Forming),
  progress: z.number().min(0).max(1),
});

export const participantFormationViewSchema = z.discriminatedUnion("subState", [
  formationProgressSchema,
  z.object({
    subState: z.literal(FormationSubState.Formed),
    ownGroup: ownGroupViewSchema,
  }),
]);

export const facilitatorFormationViewSchema = z.discriminatedUnion("subState", [
  formationProgressSchema,
  z.object({
    subState: z.literal(FormationSubState.Formed),
    groups: facilitatorGroupsSchema,
  }),
]);

export const presenterFormationViewSchema = z.discriminatedUnion("subState", [
  formationProgressSchema,
  z.object({
    subState: z.literal(FormationSubState.Formed),
    groups: presenterGroupsSchema,
  }),
]);

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
