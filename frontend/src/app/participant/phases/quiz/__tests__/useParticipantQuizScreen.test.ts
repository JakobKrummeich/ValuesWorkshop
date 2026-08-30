import { renderHook, act } from "@testing-library/react";
import { NEVER, of, throwError } from "rxjs";
import { MessageKey } from "../../../../../domain/i18n/messages";
import type { IntentResult } from "../../../../../domain/intentResult";
import { IntentRejectionCode } from "../../../../../domain/intentResult";
import type { ParticipantQuizView } from "../../../../../domain/workshopState";
import { QuizSubState } from "../../../../../domain/workshopState";
import type { Single } from "../../../../../shared/reactiveTypes";
import { useParticipantDependencies } from "../../../dependencies";
import {
  QuizScreenKind,
  useParticipantQuizScreen,
} from "../useParticipantQuizScreen";

jest.mock("../../../dependencies", () => ({
  useParticipantDependencies: jest.fn(),
}));

const dependencies = useParticipantDependencies as jest.MockedFunction<
  typeof useParticipantDependencies
>;

function withChooseAnswer(
  chooseAnswer: (
    questionIndex: number,
    answerIndex: number,
  ) => Single<IntentResult>,
) {
  dependencies.mockReturnValue({
    sessionStatePort: { workshopState: NEVER, connectionState: NEVER },
    quizPort: { chooseAnswer },
    selectionPort: { submitSelection: () => NEVER },
    groupWorkPort: {
      addAction: () => NEVER,
      editAction: () => NEVER,
      removeAction: () => NEVER,
      submitGroupWork: () => NEVER,
      reopenGroupWork: () => NEVER,
    },
    votingPort: { submitFinalVotes: () => NEVER },
  });
}

const answers = [
  { de: "Eins", en: "One" },
  { de: "Zwei", en: "Two" },
  { de: "Drei", en: "Three" },
];

function quizView(
  overrides: Partial<ParticipantQuizView> = {},
): ParticipantQuizView {
  return {
    questionIndex: 1,
    questionCount: 3,
    subState: QuizSubState.Answering,
    question: { de: "Wie viele?", en: "How many?" },
    answers,
    ownAnswerIndex: null,
    ...overrides,
  };
}

const accepted: IntentResult = { isAccepted: true, code: null, detail: null };

describe("participant quiz screen logic", () => {
  it("numbers the question for humans", () => {
    withChooseAnswer(() => NEVER);

    const { result } = renderHook(() => useParticipantQuizScreen(quizView()));

    expect(result.current.questionNumber).toBe(2);
  });

  it("offers all answers while nothing is cast", () => {
    withChooseAnswer(() => NEVER);

    const { result } = renderHook(() => useParticipantQuizScreen(quizView()));

    expect(result.current.view).toEqual({
      kind: QuizScreenKind.Answering,
      answers,
      isAnswerable: true,
    });
  });

  it("casts the chosen answer for the posed question", () => {
    const chooseAnswer = jest.fn(() => of(accepted));
    withChooseAnswer(chooseAnswer);
    const { result } = renderHook(() => useParticipantQuizScreen(quizView()));

    act(() => result.current.chooseAnswer(2));

    expect(chooseAnswer).toHaveBeenCalledWith(1, 2);
  });

  it("locks the answers while the cast is in flight", () => {
    withChooseAnswer(() => NEVER);
    const { result } = renderHook(() => useParticipantQuizScreen(quizView()));

    act(() => result.current.chooseAnswer(0));

    expect(result.current.view).toEqual({
      kind: QuizScreenKind.Answering,
      answers,
      isAnswerable: false,
    });
  });

  it("confirms the own answer once cast", () => {
    withChooseAnswer(() => NEVER);

    const { result } = renderHook(() =>
      useParticipantQuizScreen(quizView({ ownAnswerIndex: 2 })),
    );

    expect(result.current.view).toEqual({
      kind: QuizScreenKind.OwnAnswer,
      ownAnswer: { de: "Drei", en: "Three" },
    });
  });

  it.each([QuizSubState.Revealed, QuizSubState.LearningTextShown])(
    "keeps the own-answer confirmation through sub-state %s",
    (subState) => {
      withChooseAnswer(() => NEVER);

      const { result } = renderHook(() =>
        useParticipantQuizScreen(quizView({ subState, ownAnswerIndex: 1 })),
      );

      expect(result.current.view).toEqual({
        kind: QuizScreenKind.OwnAnswer,
        ownAnswer: { de: "Zwei", en: "Two" },
      });
    },
  );

  it.each([QuizSubState.Revealed, QuizSubState.LearningTextShown])(
    "waits calmly in sub-state %s when the participant stayed silent",
    (subState) => {
      withChooseAnswer(() => NEVER);

      const { result } = renderHook(() =>
        useParticipantQuizScreen(quizView({ subState })),
      );

      expect(result.current.view).toEqual({ kind: QuizScreenKind.Waiting });
    },
  );

  it("returns to the answer buttons when the next question is posed", () => {
    withChooseAnswer(() => NEVER);
    const { result, rerender } = renderHook(
      ({ quiz }: { quiz: ParticipantQuizView }) =>
        useParticipantQuizScreen(quiz),
      {
        initialProps: {
          quiz: quizView({
            subState: QuizSubState.LearningTextShown,
            ownAnswerIndex: 0,
          }),
        },
      },
    );

    rerender({ quiz: quizView({ questionIndex: 2 }) });

    expect(result.current.view).toEqual({
      kind: QuizScreenKind.Answering,
      answers,
      isAnswerable: true,
    });
  });

  it("reopens the answers with a message when the cast is rejected", () => {
    withChooseAnswer(() =>
      of({
        isAccepted: false,
        code: IntentRejectionCode.InvariantViolated,
        detail: "the answer is already cast",
      }),
    );
    const { result } = renderHook(() => useParticipantQuizScreen(quizView()));

    act(() => result.current.chooseAnswer(1));

    expect(result.current.rejectionMessage).toBe(
      MessageKey.IntentInvariantViolated,
    );
    expect(result.current.view).toEqual({
      kind: QuizScreenKind.Answering,
      answers,
      isAnswerable: true,
    });
  });

  it("shows a transport failure as a generic failure message", () => {
    withChooseAnswer(() => throwError(() => new Error("connection is closed")));
    const { result } = renderHook(() => useParticipantQuizScreen(quizView()));

    act(() => result.current.chooseAnswer(1));

    expect(result.current.rejectionMessage).toBe(MessageKey.IntentFailed);
  });
});
