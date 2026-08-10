import { fireEvent, render, screen } from "@testing-library/react";
import { Language } from "../../../../../domain/i18n/language";
import { MessageKey } from "../../../../../domain/i18n/messages";
import { Phase } from "../../../../../domain/phases";
import type { ParticipantQuizState } from "../../../../../domain/workshopState";
import { QuizSubState } from "../../../../../domain/workshopState";
import { languageWrapper } from "../../../../../testing/languageWrapper";
import { ParticipantQuizScreen } from "../ParticipantQuizScreen";
import {
  AnswerStatus,
  useParticipantQuizScreen,
  type ParticipantQuizScreenModel,
} from "../useParticipantQuizScreen";

jest.mock("../useParticipantQuizScreen", () => ({
  ...jest.requireActual("../useParticipantQuizScreen"),
  useParticipantQuizScreen: jest.fn(),
}));

const screenHook = useParticipantQuizScreen as jest.MockedFunction<
  typeof useParticipantQuizScreen
>;

const state: ParticipantQuizState = {
  phase: Phase.Quiz,
  revision: 5,
  participantCount: 3,
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
    ownAnswerIndex: null,
  },
};

function model(
  overrides: Partial<ParticipantQuizScreenModel> = {},
): ParticipantQuizScreenModel {
  return {
    questionNumber: 2,
    answers: state.quiz.answers.map((text) => ({
      text,
      status: AnswerStatus.Neutral,
    })),
    isAnswerable: true,
    chooseAnswer: jest.fn(),
    rejectionMessage: null,
    ...overrides,
  };
}

describe("participant quiz screen", () => {
  it("shows the numbered question with its answers", () => {
    screenHook.mockReturnValue(model());

    render(<ParticipantQuizScreen state={state} />, {
      wrapper: languageWrapper(),
    });

    expect(screen.getByTestId("question-heading")).toHaveTextContent(
      "Question 2 of 3",
    );
    expect(screen.getByTestId("question-text")).toHaveTextContent("How many?");
    expect(screen.getByTestId("answer-button-2")).toHaveTextContent("Three");
  });

  it("casts the tapped answer", () => {
    const chooseAnswer = jest.fn();
    screenHook.mockReturnValue(model({ chooseAnswer }));

    render(<ParticipantQuizScreen state={state} />, {
      wrapper: languageWrapper(),
    });
    fireEvent.click(screen.getByTestId("answer-button-1"));

    expect(chooseAnswer).toHaveBeenCalledWith(1);
  });

  it("locks the answer buttons when answering is closed", () => {
    screenHook.mockReturnValue(model({ isAnswerable: false }));

    render(<ParticipantQuizScreen state={state} />, {
      wrapper: languageWrapper(),
    });

    expect(screen.getByTestId("answer-button-0")).toBeDisabled();
  });

  it("exposes each answer's status for styling", () => {
    screenHook.mockReturnValue(
      model({
        answers: [
          { text: state.quiz.answers[0], status: AnswerStatus.Correct },
          { text: state.quiz.answers[1], status: AnswerStatus.Neutral },
          { text: state.quiz.answers[2], status: AnswerStatus.OwnIncorrect },
        ],
      }),
    );

    render(<ParticipantQuizScreen state={state} />, {
      wrapper: languageWrapper(),
    });

    expect(screen.getByTestId("answer-button-0")).toHaveAttribute(
      "data-answer-status",
      "correct",
    );
    expect(screen.getByTestId("answer-button-2")).toHaveAttribute(
      "data-answer-status",
      "ownIncorrect",
    );
  });

  it("shows the rejection message", () => {
    screenHook.mockReturnValue(
      model({ rejectionMessage: MessageKey.IntentInvariantViolated }),
    );

    render(<ParticipantQuizScreen state={state} />, {
      wrapper: languageWrapper(),
    });

    screen.getByText("The workshop does not allow that step right now.");
  });

  it("shows the learning text panel when it is present", () => {
    screenHook.mockReturnValue(model());
    const revealed: ParticipantQuizState = {
      ...state,
      quiz: {
        ...state.quiz,
        learningText: { de: "Weil darum.", en: "Because reasons." },
      },
    };

    render(<ParticipantQuizScreen state={revealed} />, {
      wrapper: languageWrapper(),
    });

    expect(screen.getByTestId("learning-text")).toHaveTextContent(
      "Because reasons.",
    );
  });

  it("hides the learning text panel while there is none", () => {
    screenHook.mockReturnValue(model());

    render(<ParticipantQuizScreen state={state} />, {
      wrapper: languageWrapper(),
    });

    expect(screen.queryByTestId("learning-text")).not.toBeInTheDocument();
  });

  it("speaks German when German is chosen", () => {
    screenHook.mockReturnValue(model());

    render(<ParticipantQuizScreen state={state} />, {
      wrapper: languageWrapper(Language.German),
    });

    expect(screen.getByTestId("question-heading")).toHaveTextContent(
      "Frage 2 von 3",
    );
    expect(screen.getByTestId("answer-button-1")).toHaveTextContent("Zwei");
  });
});
