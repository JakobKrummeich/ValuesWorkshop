import { fireEvent, render, screen } from "@testing-library/react";
import { Language } from "../../../../../domain/i18n/language";
import { MessageKey } from "../../../../../domain/i18n/messages";
import { Phase } from "../../../../../domain/phases";
import type { FacilitatorQuizState } from "../../../../../domain/workshopState";
import { QuizSubState } from "../../../../../domain/workshopState";
import { languageWrapper } from "../../../../../testing/languageWrapper";
import { FacilitatorQuizScreen } from "../FacilitatorQuizScreen";
import {
  useFacilitatorQuizScreen,
  type FacilitatorQuizScreenModel,
} from "../useFacilitatorQuizScreen";

jest.mock("../useFacilitatorQuizScreen", () => ({
  useFacilitatorQuizScreen: jest.fn(),
}));

const screenHook = useFacilitatorQuizScreen as jest.MockedFunction<
  typeof useFacilitatorQuizScreen
>;

const state: FacilitatorQuizState = {
  phase: Phase.Quiz,
  revision: 7,
  roster: { participants: [], participantCount: 5 },
  enabledIntents: [],
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
    answeredCount: 3,
    correctAnswerIndex: 0,
    learningText: { de: "Weil darum.", en: "Because reasons." },
  },
};

function model(
  overrides: Partial<FacilitatorQuizScreenModel> = {},
): FacilitatorQuizScreenModel {
  return {
    questionNumber: 2,
    answers: [
      {
        letter: "A",
        text: { de: "Eins", en: "One" },
        voteCount: 2,
        widthFraction: 1,
        isCorrect: true,
      },
      {
        letter: "B",
        text: { de: "Zwei", en: "Two" },
        voteCount: 1,
        widthFraction: 0.5,
        isCorrect: false,
      },
      {
        letter: "C",
        text: { de: "Drei", en: "Three" },
        voteCount: 0,
        widthFraction: 0,
        isCorrect: false,
      },
    ],
    isRevealed: false,
    quizControl: null,
    isSending: false,
    rejectionMessage: null,
    ...overrides,
  };
}

describe("facilitator quiz screen", () => {
  it("shows the numbered question with tallies and progress", () => {
    screenHook.mockReturnValue(model());

    render(<FacilitatorQuizScreen state={state} />, {
      wrapper: languageWrapper(),
    });

    expect(screen.getByTestId("question-heading")).toHaveTextContent(
      "Question 2 of 3",
    );
    expect(screen.getByTestId("question-text")).toHaveTextContent("How many?");
    expect(screen.getByTestId("answered-count")).toHaveTextContent(
      "3 of 5 have answered",
    );
    expect(screen.getByTestId("answer-tally-0")).toHaveTextContent("Votes: 2");
    expect(screen.getByTestId("answer-tally-2")).toHaveTextContent("Votes: 0");
  });

  it("always marks the correct answer", () => {
    screenHook.mockReturnValue(model());

    render(<FacilitatorQuizScreen state={state} />, {
      wrapper: languageWrapper(),
    });

    expect(screen.getByTestId("answer-row-0")).toHaveAttribute(
      "data-correct",
      "true",
    );
    expect(screen.getByTestId("answer-row-0")).toHaveTextContent(
      "Correct answer",
    );
    expect(screen.getByTestId("answer-row-1")).toHaveAttribute(
      "data-correct",
      "false",
    );
    expect(screen.getByTestId("answer-row-1")).toHaveTextContent("B");
  });

  it("scales the tally bars", () => {
    screenHook.mockReturnValue(model());

    render(<FacilitatorQuizScreen state={state} />, {
      wrapper: languageWrapper(),
    });

    expect(
      screen.getByTestId("answer-row-1").querySelector("span[style]"),
    ).toHaveStyle({ "--vote-fraction": "0.5" });
  });

  it("always shows the labelled learning text", () => {
    screenHook.mockReturnValue(model());

    render(<FacilitatorQuizScreen state={state} />, {
      wrapper: languageWrapper(),
    });

    expect(screen.getByTestId("learning-text")).toHaveTextContent(
      "Learning text",
    );
    expect(screen.getByTestId("learning-text")).toHaveTextContent(
      "Because reasons.",
    );
  });

  it("sends the enabled sub-control when pressed", () => {
    const send = jest.fn();
    screenHook.mockReturnValue(
      model({ quizControl: { label: MessageKey.QuizRevealAnswer, send } }),
    );

    render(<FacilitatorQuizScreen state={state} />, {
      wrapper: languageWrapper(),
    });
    fireEvent.click(screen.getByTestId("quiz-control-button"));

    expect(screen.getByTestId("quiz-control-button")).toHaveTextContent(
      "Reveal answer",
    );
    expect(send).toHaveBeenCalled();
  });

  it("disables the sub-control while an intent is in flight", () => {
    screenHook.mockReturnValue(
      model({
        quizControl: { label: MessageKey.QuizNextQuestion, send: jest.fn() },
        isSending: true,
      }),
    );

    render(<FacilitatorQuizScreen state={state} />, {
      wrapper: languageWrapper(),
    });

    expect(screen.getByTestId("quiz-control-button")).toBeDisabled();
  });

  it("hides the sub-control when nothing is enabled", () => {
    screenHook.mockReturnValue(model());

    render(<FacilitatorQuizScreen state={state} />, {
      wrapper: languageWrapper(),
    });

    expect(screen.queryByTestId("quiz-control-button")).not.toBeInTheDocument();
  });

  it("shows the rejection message", () => {
    screenHook.mockReturnValue(
      model({ rejectionMessage: MessageKey.IntentWrongPhase }),
    );

    render(<FacilitatorQuizScreen state={state} />, {
      wrapper: languageWrapper(),
    });

    screen.getByText("That is not possible in this phase.");
  });

  it("speaks German when German is chosen", () => {
    screenHook.mockReturnValue(model());

    render(<FacilitatorQuizScreen state={state} />, {
      wrapper: languageWrapper(Language.German),
    });

    expect(screen.getByTestId("answered-count")).toHaveTextContent(
      "3 von 5 haben geantwortet",
    );
    expect(screen.getByTestId("answer-row-0")).toHaveTextContent(
      "Richtige Antwort",
    );
  });
});
