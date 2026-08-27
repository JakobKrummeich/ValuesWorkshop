import { renderHook, act } from "@testing-library/react";
import { NEVER, of, throwError } from "rxjs";
import { MessageKey } from "../../../../../domain/i18n/messages";
import type { IntentResult } from "../../../../../domain/intentResult";
import { IntentRejectionCode } from "../../../../../domain/intentResult";
import { Phase } from "../../../../../domain/phases";
import type { FacilitatorQuizControlPort } from "../../../../../domain/ports/facilitator/quizControlPort";
import type { FacilitatorQuizState } from "../../../../../domain/workshopState";
import {
  FacilitatorIntent,
  QuizSubState,
} from "../../../../../domain/workshopState";
import { useFacilitatorDependencies } from "../../../dependencies";
import { useFacilitatorQuizScreen } from "../useFacilitatorQuizScreen";

jest.mock("../../../dependencies", () => ({
  useFacilitatorDependencies: jest.fn(),
}));

const dependencies = useFacilitatorDependencies as jest.MockedFunction<
  typeof useFacilitatorDependencies
>;

const accepted: IntentResult = { isAccepted: true, code: null, detail: null };

function withQuizControl(overrides: Partial<FacilitatorQuizControlPort> = {}) {
  const quizControl: FacilitatorQuizControlPort = {
    revealAnswer: jest.fn(() => of(accepted)),
    showLearningText: jest.fn(() => of(accepted)),
    poseNextQuestion: jest.fn(() => of(accepted)),
    ...overrides,
  };
  dependencies.mockReturnValue({
    sessionStatePort: { workshopState: NEVER, connectionState: NEVER },
    lifecyclePort: { advancePhase: () => NEVER },
    quizControlPort: quizControl,
    groupWorkControlPort: {
      reassignScribe: () => NEVER,
    },
    walkControlPort: {
      goToNextValue: () => NEVER,
      correctActionWording: () => NEVER,
    },
    votingControlPort: {
      closeVoting: () => NEVER,
      startTiebreakRound: () => NEVER,
    },
  });
  return quizControl;
}

function quizState(enabledIntents: FacilitatorIntent[]): FacilitatorQuizState {
  return {
    phase: Phase.Quiz,
    revision: 7,
    roster: { participants: [], participantCount: 5 },
    enabledIntents,
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
}

describe("facilitator quiz screen logic", () => {
  it("numbers the question for humans", () => {
    withQuizControl();

    const { result } = renderHook(() =>
      useFacilitatorQuizScreen(quizState([FacilitatorIntent.RevealAnswer])),
    );

    expect(result.current.questionNumber).toBe(2);
  });

  it.each([
    {
      intent: FacilitatorIntent.RevealAnswer,
      label: MessageKey.QuizRevealAnswer,
      portMethod: "revealAnswer" as const,
    },
    {
      intent: FacilitatorIntent.ShowLearningText,
      label: MessageKey.QuizShowLearningText,
      portMethod: "showLearningText" as const,
    },
    {
      intent: FacilitatorIntent.PoseNextQuestion,
      label: MessageKey.QuizNextQuestion,
      portMethod: "poseNextQuestion" as const,
    },
  ])(
    "morphs into $portMethod when the workshop enables it",
    ({ intent, label, portMethod }) => {
      const quizControl = withQuizControl();
      const { result } = renderHook(() =>
        useFacilitatorQuizScreen(quizState([intent])),
      );

      expect(result.current.quizControl?.label).toBe(label);

      act(() => result.current.quizControl?.send());

      expect(quizControl[portMethod]).toHaveBeenCalled();
    },
  );

  it("offers no sub-control when only advancing is enabled", () => {
    withQuizControl();

    const { result } = renderHook(() =>
      useFacilitatorQuizScreen(quizState([FacilitatorIntent.AdvancePhase])),
    );

    expect(result.current.quizControl).toBeNull();
  });

  it("offers no sub-control when nothing is enabled", () => {
    withQuizControl();

    const { result } = renderHook(() =>
      useFacilitatorQuizScreen(quizState([])),
    );

    expect(result.current.quizControl).toBeNull();
  });

  it("reports an in-flight sub-control intent", () => {
    withQuizControl({ revealAnswer: () => NEVER });
    const { result } = renderHook(() =>
      useFacilitatorQuizScreen(quizState([FacilitatorIntent.RevealAnswer])),
    );

    act(() => result.current.quizControl?.send());

    expect(result.current.isSending).toBe(true);
  });

  it("shows the message of a rejected sub-control intent", () => {
    withQuizControl({
      revealAnswer: () =>
        of({
          isAccepted: false,
          code: IntentRejectionCode.WrongPhase,
          detail: "the quiz is over",
        }),
    });
    const { result } = renderHook(() =>
      useFacilitatorQuizScreen(quizState([FacilitatorIntent.RevealAnswer])),
    );

    act(() => result.current.quizControl?.send());

    expect(result.current.rejectionMessage).toBe(MessageKey.IntentWrongPhase);
  });

  it("shows a transport failure as a generic failure message", () => {
    withQuizControl({
      revealAnswer: () => throwError(() => new Error("connection is closed")),
    });
    const { result } = renderHook(() =>
      useFacilitatorQuizScreen(quizState([FacilitatorIntent.RevealAnswer])),
    );

    act(() => result.current.quizControl?.send());

    expect(result.current.rejectionMessage).toBe(MessageKey.IntentFailed);
  });
});
