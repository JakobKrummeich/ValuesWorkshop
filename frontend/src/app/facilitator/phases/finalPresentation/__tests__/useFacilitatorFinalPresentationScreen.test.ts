import { renderHook, act } from "@testing-library/react";
import { NEVER, of, throwError } from "rxjs";
import { MessageKey } from "../../../../../domain/i18n/messages";
import type { IntentResult } from "../../../../../domain/intentResult";
import { IntentRejectionCode } from "../../../../../domain/intentResult";
import { Phase } from "../../../../../domain/phases";
import type {
  FacilitatorConclusionView,
  FacilitatorFinalPresentationState,
} from "../../../../../domain/workshopState";
import { FacilitatorIntent } from "../../../../../domain/workshopState";
import type { Single } from "../../../../../shared/reactiveTypes";
import { useFacilitatorDependencies } from "../../../dependencies";
import { useFacilitatorFinalPresentationScreen } from "../useFacilitatorFinalPresentationScreen";

jest.mock("../../../dependencies", () => ({
  useFacilitatorDependencies: jest.fn(),
}));

const dependencies = useFacilitatorDependencies as jest.MockedFunction<
  typeof useFacilitatorDependencies
>;

function withConclusionControl(conclusionControlPort: {
  revealNextValue: () => Single<IntentResult>;
}) {
  dependencies.mockReturnValue({
    sessionStatePort: { workshopState: NEVER, connectionState: NEVER },
    lifecyclePort: { advancePhase: () => NEVER },
    quizControlPort: {
      revealAnswer: () => NEVER,
      showLearningText: () => NEVER,
      poseNextQuestion: () => NEVER,
    },
    groupWorkControlPort: { reassignScribe: () => NEVER },
    walkControlPort: {
      goToNextValue: () => NEVER,
      correctActionWording: () => NEVER,
    },
    votingControlPort: {
      closeVoting: () => NEVER,
      startTiebreakRound: () => NEVER,
    },
    conclusionControlPort,
  });
}

function winner(place: number) {
  return {
    valueId: `wert-${place}`,
    text: { de: `Wert ${place}`, en: `Value ${place}` },
    place,
    voteCount: 10 - place,
  };
}

function conclusionView(
  overrides: Partial<FacilitatorConclusionView> = {},
): FacilitatorConclusionView {
  return {
    winners: [winner(1), winner(2), winner(3), winner(4), winner(5)],
    revealedCount: 2,
    isConcluded: false,
    ...overrides,
  };
}

function conclusionState(
  conclusion: FacilitatorConclusionView,
  enabledIntents: FacilitatorIntent[] = [],
): FacilitatorFinalPresentationState {
  return {
    phase: Phase.FinalPresentation,
    revision: 7,
    roster: { participants: [], participantCount: 30 },
    enabledIntents,
    conclusion,
  };
}

const accepted: IntentResult = { isAccepted: true, code: null, detail: null };

describe("facilitator final presentation screen logic", () => {
  it("reports the reveal progress with an enabled reveal while the wire offers it", () => {
    withConclusionControl({ revealNextValue: () => NEVER });

    const { result } = renderHook(() =>
      useFacilitatorFinalPresentationScreen(
        conclusionState(conclusionView(), [FacilitatorIntent.RevealNextValue]),
      ),
    );

    expect(result.current.revealedCount).toBe(2);
    expect(result.current.winnerCount).toBe(5);
    expect(result.current.isConcluded).toBe(false);
    expect(result.current.isRevealNextEnabled).toBe(true);
  });

  it("disables the reveal while the wire does not offer it", () => {
    withConclusionControl({ revealNextValue: () => NEVER });

    const { result } = renderHook(() =>
      useFacilitatorFinalPresentationScreen(conclusionState(conclusionView())),
    );

    expect(result.current.isRevealNextEnabled).toBe(false);
  });

  it("reports the conclusion once all winners are revealed", () => {
    withConclusionControl({ revealNextValue: () => NEVER });

    const { result } = renderHook(() =>
      useFacilitatorFinalPresentationScreen(
        conclusionState(
          conclusionView({ revealedCount: 5, isConcluded: true }),
        ),
      ),
    );

    expect(result.current.revealedCount).toBe(5);
    expect(result.current.isConcluded).toBe(true);
  });

  it("reveals the next value through the port", () => {
    const revealNextValue = jest.fn(() => of(accepted));
    withConclusionControl({ revealNextValue });
    const { result } = renderHook(() =>
      useFacilitatorFinalPresentationScreen(
        conclusionState(conclusionView(), [FacilitatorIntent.RevealNextValue]),
      ),
    );

    act(() => result.current.revealNextValue());

    expect(revealNextValue).toHaveBeenCalled();
    expect(result.current.rejectionMessage).toBeNull();
    expect(result.current.isSending).toBe(false);
  });

  it("marks the send in flight while the hub has not answered", () => {
    withConclusionControl({ revealNextValue: () => NEVER });
    const { result } = renderHook(() =>
      useFacilitatorFinalPresentationScreen(
        conclusionState(conclusionView(), [FacilitatorIntent.RevealNextValue]),
      ),
    );

    act(() => result.current.revealNextValue());

    expect(result.current.isSending).toBe(true);
  });

  it("surfaces a rejection from the hub", () => {
    withConclusionControl({
      revealNextValue: () =>
        of({
          isAccepted: false,
          code: IntentRejectionCode.WrongPhase,
          detail: "the session is not in the final presentation phase",
        }),
    });
    const { result } = renderHook(() =>
      useFacilitatorFinalPresentationScreen(conclusionState(conclusionView())),
    );

    act(() => result.current.revealNextValue());

    expect(result.current.rejectionMessage).toBe(MessageKey.IntentWrongPhase);
  });

  it("shows a transport failure as a generic failure message", () => {
    withConclusionControl({
      revealNextValue: () => throwError(() => new Error("connection lost")),
    });
    const { result } = renderHook(() =>
      useFacilitatorFinalPresentationScreen(conclusionState(conclusionView())),
    );

    act(() => result.current.revealNextValue());

    expect(result.current.rejectionMessage).toBe(MessageKey.IntentFailed);
  });
});
