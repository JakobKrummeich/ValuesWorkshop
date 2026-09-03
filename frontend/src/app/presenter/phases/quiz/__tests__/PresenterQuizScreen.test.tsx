import { render, screen } from "@testing-library/react";
import { Language } from "../../../../../domain/i18n/language";
import { Phase } from "../../../../../domain/phases";
import type { PresenterQuizState } from "../../../../../domain/workshopState";
import { QuizSubState } from "../../../../../domain/workshopState";
import { languageWrapper } from "../../../../../testing/languageWrapper";
import { PresenterQuizScreen } from "../PresenterQuizScreen";
import {
  AnswerBarEmphasis,
  type PresenterQuizBar,
  type PresenterQuizScreenModel,
  QuizWallView,
  usePresenterQuizScreen,
} from "../usePresenterQuizScreen";

jest.mock("../usePresenterQuizScreen", () => ({
  ...jest.requireActual("../usePresenterQuizScreen"),
  usePresenterQuizScreen: jest.fn(),
}));

const screenHook = usePresenterQuizScreen as jest.MockedFunction<
  typeof usePresenterQuizScreen
>;

const state: PresenterQuizState = {
  phase: Phase.Quiz,
  revision: 9,
  participantCount: 5,
  quiz: {
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
  },
};

function bars(
  emphases: [AnswerBarEmphasis, AnswerBarEmphasis, AnswerBarEmphasis],
): PresenterQuizBar[] {
  return [
    { text: state.quiz.answers[0], voteCount: 2, widthFraction: 1 },
    { text: state.quiz.answers[1], voteCount: 1, widthFraction: 0.5 },
    { text: state.quiz.answers[2], voteCount: 0, widthFraction: 0 },
  ].map((bar, index) => ({ ...bar, emphasis: emphases[index] }));
}

function tally(
  emphases: [AnswerBarEmphasis, AnswerBarEmphasis, AnswerBarEmphasis] = [
    AnswerBarEmphasis.Live,
    AnswerBarEmphasis.Live,
    AnswerBarEmphasis.Live,
  ],
): PresenterQuizScreenModel {
  return { view: QuizWallView.Tally, questionNumber: 2, bars: bars(emphases) };
}

function renderWith(model: PresenterQuizScreenModel, language?: Language) {
  screenHook.mockReturnValue(model);

  return render(<PresenterQuizScreen state={state} />, {
    wrapper: languageWrapper(language),
  });
}

describe("presenter quiz screen", () => {
  it("shows the numbered question with one bar per answer", () => {
    renderWith(tally());

    expect(screen.getByTestId("question-heading")).toHaveTextContent(
      "Question 2 of 3",
    );
    expect(screen.getByTestId("question-text")).toHaveTextContent("How many?");
    expect(screen.getByTestId("answer-row-2")).toHaveTextContent("Three");
    expect(screen.getByTestId("answer-votes-0")).toHaveTextContent("2");
    expect(screen.queryByTestId("learning-text")).not.toBeInTheDocument();
  });

  it("drives every bar width from its vote fraction", () => {
    renderWith(tally());

    expect(screen.getByTestId("answer-bar-1").getAttribute("style")).toContain(
      "--vote-fraction: 0.5",
    );
    expect(screen.getByTestId("answer-bar-1").className).toMatch(/liveBar/);
  });

  it("lifts the correct bar and dims the others after the reveal", () => {
    renderWith(
      tally([
        AnswerBarEmphasis.Correct,
        AnswerBarEmphasis.Dimmed,
        AnswerBarEmphasis.Dimmed,
      ]),
    );

    expect(screen.getByTestId("answer-row-0")).toHaveAttribute(
      "data-correct",
      "true",
    );
    expect(screen.getByTestId("answer-row-1")).toHaveAttribute(
      "data-correct",
      "false",
    );
    expect(screen.getByTestId("answer-bar-0").className).toMatch(/correctBar/);
    expect(screen.getByTestId("answer-bar-1").className).toMatch(/dimmedBar/);
  });

  it("gives the learning text the whole wall with the correct answer on top", () => {
    renderWith({
      view: QuizWallView.LearningText,
      correctAnswer: state.quiz.answers[1],
      learningText: { de: "Weil darum.", en: "Because reasons." },
    });

    expect(screen.getByTestId("learning-text")).toHaveTextContent(
      "Learning text",
    );
    expect(screen.getByTestId("learning-text")).toHaveTextContent(
      "Because reasons.",
    );
    expect(screen.getByTestId("learning-correct-answer")).toHaveTextContent(
      "Two",
    );
    expect(screen.queryByTestId("question-heading")).not.toBeInTheDocument();
    expect(screen.queryByTestId("answer-row-0")).not.toBeInTheDocument();
  });

  it("speaks German when German is chosen", () => {
    renderWith(
      {
        view: QuizWallView.LearningText,
        correctAnswer: state.quiz.answers[1],
        learningText: { de: "Weil darum.", en: "Because reasons." },
      },
      Language.German,
    );

    expect(screen.getByTestId("learning-text")).toHaveTextContent("Lerntext");
    expect(screen.getByTestId("learning-text")).toHaveTextContent(
      "Weil darum.",
    );
    expect(screen.getByTestId("learning-correct-answer")).toHaveTextContent(
      "Zwei",
    );
  });
});
