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
  AnswerStatus,
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
  });
}

function quizView(
  overrides: Partial<ParticipantQuizView> = {},
): ParticipantQuizView {
  return {
    questionIndex: 1,
    questionCount: 3,
    subState: QuizSubState.Answering,
    question: { de: "Wie viele?", en: "How many?" },
    answers: [
      { de: "Eins", en: "One" },
      { de: "Zwei", en: "Two" },
      { de: "Drei", en: "Three" },
    ],
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

  it("offers all answers neutrally while nothing is cast", () => {
    withChooseAnswer(() => NEVER);

    const { result } = renderHook(() => useParticipantQuizScreen(quizView()));

    expect(result.current.isAnswerable).toBe(true);
    expect(result.current.answers.map((answer) => answer.status)).toEqual([
      AnswerStatus.Neutral,
      AnswerStatus.Neutral,
      AnswerStatus.Neutral,
    ]);
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

    expect(result.current.isAnswerable).toBe(false);
  });

  it("keeps the own answer marked and locked once cast", () => {
    withChooseAnswer(() => NEVER);

    const { result } = renderHook(() =>
      useParticipantQuizScreen(quizView({ ownAnswerIndex: 2 })),
    );

    expect(result.current.isAnswerable).toBe(false);
    expect(result.current.answers[2].status).toBe(AnswerStatus.Own);
  });

  it("locks the answers once the reveal has happened", () => {
    withChooseAnswer(() => NEVER);

    const { result } = renderHook(() =>
      useParticipantQuizScreen(
        quizView({ subState: QuizSubState.Revealed, correctAnswerIndex: 0 }),
      ),
    );

    expect(result.current.isAnswerable).toBe(false);
  });

  it("highlights the revealed correct answer", () => {
    withChooseAnswer(() => NEVER);

    const { result } = renderHook(() =>
      useParticipantQuizScreen(
        quizView({
          subState: QuizSubState.Revealed,
          ownAnswerIndex: 0,
          correctAnswerIndex: 0,
        }),
      ),
    );

    expect(result.current.answers.map((answer) => answer.status)).toEqual([
      AnswerStatus.Correct,
      AnswerStatus.Neutral,
      AnswerStatus.Neutral,
    ]);
  });

  it("marks the own answer distinctly when it turned out wrong", () => {
    withChooseAnswer(() => NEVER);

    const { result } = renderHook(() =>
      useParticipantQuizScreen(
        quizView({
          subState: QuizSubState.Revealed,
          ownAnswerIndex: 2,
          correctAnswerIndex: 0,
        }),
      ),
    );

    expect(result.current.answers.map((answer) => answer.status)).toEqual([
      AnswerStatus.Correct,
      AnswerStatus.Neutral,
      AnswerStatus.OwnIncorrect,
    ]);
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
    expect(result.current.isAnswerable).toBe(true);
  });

  it("shows a transport failure as a generic failure message", () => {
    withChooseAnswer(() => throwError(() => new Error("connection is closed")));
    const { result } = renderHook(() => useParticipantQuizScreen(quizView()));

    act(() => result.current.chooseAnswer(1));

    expect(result.current.rejectionMessage).toBe(MessageKey.IntentFailed);
  });
});
