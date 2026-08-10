import { render, screen } from "@testing-library/react";
import { Language } from "../../../../../domain/i18n/language";
import { Phase } from "../../../../../domain/phases";
import type { PresenterQuizState } from "../../../../../domain/workshopState";
import { QuizSubState } from "../../../../../domain/workshopState";
import { languageWrapper } from "../../../../../testing/languageWrapper";
import { PresenterQuizScreen } from "../PresenterQuizScreen";
import {
  usePresenterQuizScreen,
  type PresenterQuizScreenModel,
} from "../usePresenterQuizScreen";

jest.mock("../usePresenterQuizScreen", () => ({
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

function model(
  overrides: Partial<PresenterQuizScreenModel> = {},
): PresenterQuizScreenModel {
  return {
    questionNumber: 2,
    isRevealed: false,
    bars: [
      {
        text: state.quiz.answers[0],
        voteCount: 2,
        widthFraction: 1,
        isCorrect: false,
      },
      {
        text: state.quiz.answers[1],
        voteCount: 1,
        widthFraction: 0.5,
        isCorrect: false,
      },
      {
        text: state.quiz.answers[2],
        voteCount: 0,
        widthFraction: 0,
        isCorrect: false,
      },
    ],
    ...overrides,
  };
}

describe("presenter quiz screen", () => {
  it("shows the numbered question with one bar per answer", () => {
    screenHook.mockReturnValue(model());

    render(<PresenterQuizScreen state={state} />, {
      wrapper: languageWrapper(),
    });

    expect(screen.getByTestId("question-heading")).toHaveTextContent(
      "Question 2 of 3",
    );
    expect(screen.getByTestId("question-text")).toHaveTextContent("How many?");
    expect(screen.getByTestId("answer-row-2")).toHaveTextContent("Three");
    expect(screen.getByTestId("answer-votes-0")).toHaveTextContent("2");
  });

  it("drives every bar width from its vote fraction", () => {
    screenHook.mockReturnValue(model());

    render(<PresenterQuizScreen state={state} />, {
      wrapper: languageWrapper(),
    });

    expect(screen.getByTestId("answer-bar-1").getAttribute("style")).toContain(
      "--vote-fraction: 0.5",
    );
  });

  it("marks the correct bar after the reveal", () => {
    screenHook.mockReturnValue(
      model({
        isRevealed: true,
        bars: [
          {
            text: state.quiz.answers[0],
            voteCount: 2,
            widthFraction: 1,
            isCorrect: true,
          },
          {
            text: state.quiz.answers[1],
            voteCount: 1,
            widthFraction: 0.5,
            isCorrect: false,
          },
          {
            text: state.quiz.answers[2],
            voteCount: 0,
            widthFraction: 0,
            isCorrect: false,
          },
        ],
      }),
    );

    render(<PresenterQuizScreen state={state} />, {
      wrapper: languageWrapper(),
    });

    expect(screen.getByTestId("answer-row-0")).toHaveAttribute(
      "data-correct",
      "true",
    );
    expect(screen.getByTestId("answer-row-1")).toHaveAttribute(
      "data-correct",
      "false",
    );
  });

  it("shows the learning text panel when it is present", () => {
    screenHook.mockReturnValue(model());
    const withLearningText: PresenterQuizState = {
      ...state,
      quiz: {
        ...state.quiz,
        learningText: { de: "Weil darum.", en: "Because reasons." },
      },
    };

    render(<PresenterQuizScreen state={withLearningText} />, {
      wrapper: languageWrapper(),
    });

    expect(screen.getByTestId("learning-text")).toHaveTextContent(
      "Because reasons.",
    );
  });

  it("hides the learning text panel while there is none", () => {
    screenHook.mockReturnValue(model());

    render(<PresenterQuizScreen state={state} />, {
      wrapper: languageWrapper(),
    });

    expect(screen.queryByTestId("learning-text")).not.toBeInTheDocument();
  });

  it("speaks German when German is chosen", () => {
    screenHook.mockReturnValue(model());

    render(<PresenterQuizScreen state={state} />, {
      wrapper: languageWrapper(Language.German),
    });

    expect(screen.getByTestId("question-heading")).toHaveTextContent(
      "Frage 2 von 3",
    );
    expect(screen.getByTestId("answer-row-0")).toHaveTextContent("Eins");
  });
});
