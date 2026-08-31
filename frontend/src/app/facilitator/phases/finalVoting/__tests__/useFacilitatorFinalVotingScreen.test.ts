import { renderHook, act } from "@testing-library/react";
import { NEVER, of, throwError } from "rxjs";
import { MessageKey } from "../../../../../domain/i18n/messages";
import type { IntentResult } from "../../../../../domain/intentResult";
import { IntentRejectionCode } from "../../../../../domain/intentResult";
import { Phase } from "../../../../../domain/phases";
import type {
  FacilitatorFinalVotingState,
  FacilitatorVotingView,
} from "../../../../../domain/workshopState";
import { FacilitatorIntent } from "../../../../../domain/workshopState";
import type { Single } from "../../../../../shared/reactiveTypes";
import { useFacilitatorDependencies } from "../../../dependencies";
import { useFacilitatorFinalVotingScreen } from "../useFacilitatorFinalVotingScreen";

jest.mock("../../../dependencies", () => ({
  useFacilitatorDependencies: jest.fn(),
}));

const dependencies = useFacilitatorDependencies as jest.MockedFunction<
  typeof useFacilitatorDependencies
>;

function withVotingControl(votingControlPort: {
  closeVoting: () => Single<IntentResult>;
  startTiebreakRound: () => Single<IntentResult>;
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
    votingControlPort,
    conclusionControlPort: { revealNextValue: () => NEVER },
  });
}

function votingView(
  overrides: Partial<FacilitatorVotingView> = {},
): FacilitatorVotingView {
  return {
    roundNumber: 1,
    allotment: 5,
    eligibleValues: [
      { valueId: "wert-1", text: { de: "Wert 1", en: "Value 1" } },
      { valueId: "wert-2", text: { de: "Wert 2", en: "Value 2" } },
      { valueId: "wert-3", text: { de: "Wert 3", en: "Value 3" } },
    ],
    isRoundOpen: true,
    votedCount: 12,
    participantCount: 30,
    ...overrides,
  };
}

function votingState(
  voting: FacilitatorVotingView,
  enabledIntents: FacilitatorIntent[] = [],
): FacilitatorFinalVotingState {
  return {
    phase: Phase.FinalVoting,
    revision: 7,
    roster: { participants: [], participantCount: 30 },
    enabledIntents,
    voting,
  };
}

const accepted: IntentResult = { isAccepted: true, code: null, detail: null };

describe("facilitator final voting screen logic", () => {
  it("reports the round progress of an open round without tallies", () => {
    withVotingControl({
      closeVoting: () => NEVER,
      startTiebreakRound: () => NEVER,
    });

    const { result } = renderHook(() =>
      useFacilitatorFinalVotingScreen(
        votingState(votingView(), [FacilitatorIntent.CloseVoting]),
      ),
    );

    expect(result.current.roundNumber).toBe(1);
    expect(result.current.votedCount).toBe(12);
    expect(result.current.participantCount).toBe(30);
    expect(result.current.isRoundOpen).toBe(true);
    expect(result.current.isCloseVotingEnabled).toBe(true);
    expect(result.current.isStartTiebreakEnabled).toBe(false);
    expect(result.current.tallies).toBeNull();
    expect(result.current.tie).toBeNull();
  });

  it("disables the close while the wire does not offer it", () => {
    withVotingControl({
      closeVoting: () => NEVER,
      startTiebreakRound: () => NEVER,
    });

    const { result } = renderHook(() =>
      useFacilitatorFinalVotingScreen(votingState(votingView())),
    );

    expect(result.current.isCloseVotingEnabled).toBe(false);
  });

  it("ranks the closed round's tallies by count and presentation order", () => {
    withVotingControl({
      closeVoting: () => NEVER,
      startTiebreakRound: () => NEVER,
    });

    const { result } = renderHook(() =>
      useFacilitatorFinalVotingScreen(
        votingState(
          votingView({
            isRoundOpen: false,
            closedRoundTallies: { "wert-1": 3, "wert-2": 9, "wert-3": 3 },
          }),
        ),
      ),
    );

    expect(result.current.tallies).toEqual([
      {
        valueId: "wert-2",
        text: { de: "Wert 2", en: "Value 2" },
        voteCount: 9,
      },
      {
        valueId: "wert-1",
        text: { de: "Wert 1", en: "Value 1" },
        voteCount: 3,
      },
      {
        valueId: "wert-3",
        text: { de: "Wert 3", en: "Value 3" },
        voteCount: 3,
      },
    ]);
  });

  it("falls back to the raw id for a tally outside the presented set", () => {
    withVotingControl({
      closeVoting: () => NEVER,
      startTiebreakRound: () => NEVER,
    });

    const { result } = renderHook(() =>
      useFacilitatorFinalVotingScreen(
        votingState(
          votingView({
            isRoundOpen: false,
            closedRoundTallies: { unknown: 1 },
          }),
        ),
      ),
    );

    expect(result.current.tallies).toEqual([
      {
        valueId: "unknown",
        text: { de: "unknown", en: "unknown" },
        voteCount: 1,
      },
    ]);
  });

  it("derives the tie callout from the tied values and their tally", () => {
    withVotingControl({
      closeVoting: () => NEVER,
      startTiebreakRound: () => NEVER,
    });

    const { result } = renderHook(() =>
      useFacilitatorFinalVotingScreen(
        votingState(
          votingView({
            isRoundOpen: false,
            closedRoundTallies: { "wert-1": 9, "wert-2": 3, "wert-3": 3 },
            tiedValueIds: ["wert-2", "wert-3"],
          }),
          [FacilitatorIntent.StartTiebreakRound],
        ),
      ),
    );

    expect(result.current.tie).toEqual({
      values: [
        { de: "Wert 2", en: "Value 2" },
        { de: "Wert 3", en: "Value 3" },
      ],
      voteCount: 3,
    });
    expect(result.current.isStartTiebreakEnabled).toBe(true);
  });

  it("closes the voting through the port", () => {
    const closeVoting = jest.fn(() => of(accepted));
    withVotingControl({ closeVoting, startTiebreakRound: () => NEVER });
    const { result } = renderHook(() =>
      useFacilitatorFinalVotingScreen(
        votingState(votingView(), [FacilitatorIntent.CloseVoting]),
      ),
    );

    act(() => result.current.closeVoting());

    expect(closeVoting).toHaveBeenCalled();
    expect(result.current.rejectionMessage).toBeNull();
    expect(result.current.isSending).toBe(false);
  });

  it("starts the tiebreak through the port", () => {
    const startTiebreakRound = jest.fn(() => of(accepted));
    withVotingControl({ closeVoting: () => NEVER, startTiebreakRound });
    const { result } = renderHook(() =>
      useFacilitatorFinalVotingScreen(votingState(votingView())),
    );

    act(() => result.current.startTiebreakRound());

    expect(startTiebreakRound).toHaveBeenCalled();
  });

  it("marks the send in flight while the hub has not answered", () => {
    withVotingControl({
      closeVoting: () => NEVER,
      startTiebreakRound: () => NEVER,
    });
    const { result } = renderHook(() =>
      useFacilitatorFinalVotingScreen(
        votingState(votingView(), [FacilitatorIntent.CloseVoting]),
      ),
    );

    act(() => result.current.closeVoting());

    expect(result.current.isSending).toBe(true);
  });

  it("surfaces a rejection from the hub", () => {
    withVotingControl({
      closeVoting: () =>
        of({
          isAccepted: false,
          code: IntentRejectionCode.WrongPhase,
          detail: "the session is not in the final voting phase",
        }),
      startTiebreakRound: () => NEVER,
    });
    const { result } = renderHook(() =>
      useFacilitatorFinalVotingScreen(votingState(votingView())),
    );

    act(() => result.current.closeVoting());

    expect(result.current.rejectionMessage).toBe(MessageKey.IntentWrongPhase);
  });

  it("shows a transport failure as a generic failure message", () => {
    withVotingControl({
      closeVoting: () => throwError(() => new Error("connection lost")),
      startTiebreakRound: () => NEVER,
    });
    const { result } = renderHook(() =>
      useFacilitatorFinalVotingScreen(votingState(votingView())),
    );

    act(() => result.current.closeVoting());

    expect(result.current.rejectionMessage).toBe(MessageKey.IntentFailed);
  });
});
