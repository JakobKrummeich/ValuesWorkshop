import { renderHook } from "@testing-library/react";
import type { PresenterQuizView } from "../../../../../domain/workshopState";
import { QuizSubState } from "../../../../../domain/workshopState";
import { usePresenterQuizScreen } from "../usePresenterQuizScreen";

function quizView(
  overrides: Partial<PresenterQuizView> = {},
): PresenterQuizView {
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
    answerTallies: [2, 1, 0],
    ...overrides,
  };
}

describe("presenter quiz screen logic", () => {
  it("numbers the question for humans", () => {
    const { result } = renderHook(() => usePresenterQuizScreen(quizView()));

    expect(result.current.questionNumber).toBe(2);
  });

  it("scales each bar relative to the strongest answer", () => {
    const { result } = renderHook(() => usePresenterQuizScreen(quizView()));

    expect(result.current.bars.map((bar) => bar.widthFraction)).toEqual([
      1, 0.5, 0,
    ]);
  });

  it("keeps all bars at zero width before any vote arrived", () => {
    const { result } = renderHook(() =>
      usePresenterQuizScreen(quizView({ answerTallies: [0, 0, 0] })),
    );

    expect(result.current.bars.map((bar) => bar.widthFraction)).toEqual([
      0, 0, 0,
    ]);
  });

  it("carries the vote count of every answer", () => {
    const { result } = renderHook(() => usePresenterQuizScreen(quizView()));

    expect(result.current.bars.map((bar) => bar.voteCount)).toEqual([2, 1, 0]);
  });

  it("highlights no bar before the reveal", () => {
    const { result } = renderHook(() => usePresenterQuizScreen(quizView()));

    expect(result.current.isRevealed).toBe(false);
    expect(result.current.bars.every((bar) => !bar.isCorrect)).toBe(true);
  });

  it("highlights the correct bar after the reveal", () => {
    const { result } = renderHook(() =>
      usePresenterQuizScreen(
        quizView({ subState: QuizSubState.Revealed, correctAnswerIndex: 0 }),
      ),
    );

    expect(result.current.isRevealed).toBe(true);
    expect(result.current.bars.map((bar) => bar.isCorrect)).toEqual([
      true,
      false,
      false,
    ]);
  });
});
