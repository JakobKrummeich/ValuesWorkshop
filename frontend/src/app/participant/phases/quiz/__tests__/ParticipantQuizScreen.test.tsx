import { fireEvent, render, screen } from "@testing-library/react";
import { Language } from "../../../../../domain/i18n/language";
import { MessageKey } from "../../../../../domain/i18n/messages";
import { Phase } from "../../../../../domain/phases";
import type { ParticipantQuizState } from "../../../../../domain/workshopState";
import { QuizSubState } from "../../../../../domain/workshopState";
import { languageWrapper } from "../../../../../testing/languageWrapper";
import { ParticipantQuizScreen } from "../ParticipantQuizScreen";
import {
  QuizScreenKind,
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
    view: {
      kind: QuizScreenKind.Answering,
      answers: state.quiz.answers,
      isAnswerable: true,
    },
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
    expect(
      screen.queryByTestId("own-answer-confirmation"),
    ).not.toBeInTheDocument();
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
    screenHook.mockReturnValue(
      model({
        view: {
          kind: QuizScreenKind.Answering,
          answers: state.quiz.answers,
          isAnswerable: false,
        },
      }),
    );

    render(<ParticipantQuizScreen state={state} />, {
      wrapper: languageWrapper(),
    });

    expect(screen.getByTestId("answer-button-0")).toBeDisabled();
  });

  it("replaces the answer buttons with the own-answer confirmation once cast", () => {
    screenHook.mockReturnValue(
      model({
        view: {
          kind: QuizScreenKind.OwnAnswer,
          ownAnswer: { de: "Zwei", en: "Two" },
        },
      }),
    );

    render(<ParticipantQuizScreen state={state} />, {
      wrapper: languageWrapper(),
    });

    expect(screen.getByTestId("own-answer-confirmation")).toHaveTextContent(
      "Your answer:",
    );
    expect(screen.getByTestId("own-answer-text")).toHaveTextContent("Two");
    expect(screen.queryByTestId("answer-button-0")).not.toBeInTheDocument();
    expect(screen.queryByTestId("learning-text")).not.toBeInTheDocument();
  });

  it("shows nothing but the waiting screen while the participant waits", () => {
    screenHook.mockReturnValue(
      model({ view: { kind: QuizScreenKind.Waiting } }),
    );

    render(<ParticipantQuizScreen state={state} />, {
      wrapper: languageWrapper(),
    });

    expect(screen.getByTestId("waiting-screen")).toBeInTheDocument();
    expect(screen.queryByTestId("question-heading")).not.toBeInTheDocument();
    expect(screen.queryByTestId("answer-button-0")).not.toBeInTheDocument();
    expect(
      screen.queryByTestId("own-answer-confirmation"),
    ).not.toBeInTheDocument();
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
