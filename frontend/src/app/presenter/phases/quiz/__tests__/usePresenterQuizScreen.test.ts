import { renderHook } from "@testing-library/react";
import type { PresenterQuizView } from "../../../../../domain/workshopState";
import { QuizSubState } from "../../../../../domain/workshopState";
import {
  AnswerBarEmphasis,
  QuizWallView,
  usePresenterQuizScreen,
} from "../usePresenterQuizScreen";

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

function tallyOf(view: PresenterQuizView) {
  const { result } = renderHook(() => usePresenterQuizScreen(view));
  if (result.current.view !== QuizWallView.Tally) {
    throw new Error("Expected the tally view");
  }
  return result.current;
}

describe("presenter quiz screen logic", () => {
  it("numbers the question for humans", () => {
    expect(tallyOf(quizView()).questionNumber).toBe(2);
  });

  it("scales each bar relative to the strongest answer", () => {
    expect(tallyOf(quizView()).bars.map((bar) => bar.widthFraction)).toEqual([
      1, 0.5, 0,
    ]);
  });

  it("keeps all bars at zero width before any vote arrived", () => {
    expect(
      tallyOf(quizView({ answerTallies: [0, 0, 0] })).bars.map(
        (bar) => bar.widthFraction,
      ),
    ).toEqual([0, 0, 0]);
  });

  it("carries the text and vote count of every answer", () => {
    const { bars } = tallyOf(quizView());

    expect(bars.map((bar) => bar.voteCount)).toEqual([2, 1, 0]);
    expect(bars[2].text).toEqual({ de: "Drei", en: "Three" });
  });

  it("shows every bar live before the reveal", () => {
    expect(tallyOf(quizView()).bars.map((bar) => bar.emphasis)).toEqual([
      AnswerBarEmphasis.Live,
      AnswerBarEmphasis.Live,
      AnswerBarEmphasis.Live,
    ]);
  });

  it("lifts the correct bar and dims the others after the reveal", () => {
    const { bars } = tallyOf(
      quizView({ subState: QuizSubState.Revealed, correctAnswerIndex: 0 }),
    );

    expect(bars.map((bar) => bar.emphasis)).toEqual([
      AnswerBarEmphasis.Correct,
      AnswerBarEmphasis.Dimmed,
      AnswerBarEmphasis.Dimmed,
    ]);
  });

  it("gives the learning text its own view together with the correct answer", () => {
    const { result } = renderHook(() =>
      usePresenterQuizScreen(
        quizView({
          subState: QuizSubState.LearningTextShown,
          correctAnswerIndex: 1,
          learningText: { de: "Weil darum.", en: "Because reasons." },
        }),
      ),
    );

    expect(result.current).toEqual({
      view: QuizWallView.LearningText,
      correctAnswer: { de: "Zwei", en: "Two" },
      learningText: { de: "Weil darum.", en: "Because reasons." },
    });
  });

  it("stays with the tally while a learning text arrives without a correct answer", () => {
    const { view } = tallyOf(
      quizView({
        learningText: { de: "Weil darum.", en: "Because reasons." },
      }),
    );

    expect(view).toBe(QuizWallView.Tally);
  });
});
