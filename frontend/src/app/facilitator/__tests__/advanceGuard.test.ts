import { MessageKey } from "../../../domain/i18n/messages";
import { Phase } from "../../../domain/phases";
import {
  FacilitatorIntent,
  FormationSubState,
  GroupWorkStatus,
  QuizSubState,
  type FacilitatorWorkshopState,
} from "../../../domain/workshopState";
import { advanceGuardMessageOf } from "../advanceGuard";

const roster = { participants: [], participantCount: 3 };

const advanceEnabled = [FacilitatorIntent.AdvancePhase];

function quizState(enabledIntents: FacilitatorIntent[]) {
  return {
    phase: Phase.Quiz,
    revision: 1,
    roster,
    enabledIntents,
    quiz: {
      questionIndex: 4,
      questionCount: 5,
      subState: QuizSubState.LearningTextShown,
      question: { de: "F", en: "Q" },
      answers: [],
      answerTallies: [],
      answeredCount: 0,
      correctAnswerIndex: 0,
      learningText: { de: "L", en: "L" },
    },
  } satisfies FacilitatorWorkshopState;
}

function selectionState(submittedCount: number) {
  return {
    phase: Phase.ValueSelection,
    revision: 1,
    roster,
    enabledIntents: advanceEnabled,
    selection: { values: [], submittedCount },
  } satisfies FacilitatorWorkshopState;
}

describe("advance guard", () => {
  it("advises to wait for everybody during the join phase even though advancing is allowed", () => {
    expect(
      advanceGuardMessageOf({
        phase: Phase.Join,
        revision: 1,
        roster,
        enabledIntents: advanceEnabled,
      }),
    ).toBe(MessageKey.AdvanceGuardJoin);
  });

  it("explains what blocks the quiz exit", () => {
    expect(
      advanceGuardMessageOf(quizState([FacilitatorIntent.PoseNextQuestion])),
    ).toBe(MessageKey.AdvanceGuardQuiz);
  });

  it("falls silent once the quiz allows advancing", () => {
    expect(advanceGuardMessageOf(quizState(advanceEnabled))).toBeNull();
  });

  it("advises to wait for the missing selections", () => {
    expect(advanceGuardMessageOf(selectionState(2))).toBe(
      MessageKey.AdvanceGuardSelection,
    );
  });

  it("falls silent once every selection is in", () => {
    expect(advanceGuardMessageOf(selectionState(3))).toBeNull();
  });

  it("has nothing to say about the results", () => {
    expect(
      advanceGuardMessageOf({
        phase: Phase.SelectionResults,
        revision: 1,
        roster,
        enabledIntents: advanceEnabled,
        selection: { values: [], submittedCount: 3 },
      }),
    ).toBeNull();
  });

  it("explains the wait while the groups form", () => {
    expect(
      advanceGuardMessageOf({
        phase: Phase.GroupFormation,
        revision: 1,
        roster,
        enabledIntents: [],
        selection: { values: [], submittedCount: 3 },
        formation: { subState: FormationSubState.Forming, progress: 0.4 },
      }),
    ).toBe(MessageKey.AdvanceGuardGroupFormation);
  });

  it("explains the wait for the group results", () => {
    expect(
      advanceGuardMessageOf({
        phase: Phase.GroupWork,
        revision: 1,
        roster,
        enabledIntents: [FacilitatorIntent.ReassignScribe],
        groups: [
          {
            name: { animalId: "otter", text: { de: "Otter", en: "Otter" } },
            members: [],
            assignedValues: [],
            workStatus: GroupWorkStatus.Editing,
          },
        ],
      }),
    ).toBe(MessageKey.AdvanceGuardGroupWork);
  });

  it("explains the wait for the last presented value", () => {
    expect(
      advanceGuardMessageOf({
        phase: Phase.ValuePresentation,
        revision: 1,
        roster,
        enabledIntents: [FacilitatorIntent.GoToNextValue],
        groups: [],
        presentation: {
          presentingGroupName: null,
          presentedValueId: null,
          presentedActions: [],
        },
      }),
    ).toBe(MessageKey.AdvanceGuardValuePresentation);
  });

  it("explains the wait for the winners", () => {
    expect(
      advanceGuardMessageOf({
        phase: Phase.FinalVoting,
        revision: 1,
        roster,
        enabledIntents: [FacilitatorIntent.CloseVoting],
        voting: {
          roundNumber: 1,
          allotment: 5,
          eligibleValues: [],
          isRoundOpen: true,
          votedCount: 0,
          participantCount: 3,
        },
      }),
    ).toBe(MessageKey.AdvanceGuardFinalVoting);
  });

  it("has nothing to say in the last phase", () => {
    expect(
      advanceGuardMessageOf({
        phase: Phase.FinalPresentation,
        revision: 1,
        roster,
        enabledIntents: [],
        conclusion: { revealedCount: 0, winnerCount: 5, isConcluded: false },
      }),
    ).toBeNull();
  });
});
