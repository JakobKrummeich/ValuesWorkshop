import { render, screen } from "@testing-library/react";
import { MessageKey } from "../../../../../domain/i18n/messages";
import { Phase } from "../../../../../domain/phases";
import type { FacilitatorFinalVotingState } from "../../../../../domain/workshopState";
import { languageWrapper } from "../../../../../testing/languageWrapper";
import { FacilitatorFinalVotingScreen } from "../FacilitatorFinalVotingScreen";
import { useFacilitatorFinalVotingScreen } from "../useFacilitatorFinalVotingScreen";

jest.mock("../useFacilitatorFinalVotingScreen", () => ({
  useFacilitatorFinalVotingScreen: jest.fn(),
}));

const screenHook = useFacilitatorFinalVotingScreen as jest.MockedFunction<
  typeof useFacilitatorFinalVotingScreen
>;

const state = {
  phase: Phase.FinalVoting,
} as unknown as FacilitatorFinalVotingState;

function model(
  overrides: Partial<ReturnType<typeof useFacilitatorFinalVotingScreen>> = {},
): ReturnType<typeof useFacilitatorFinalVotingScreen> {
  return {
    roundNumber: 1,
    votedCount: 24,
    participantCount: 30,
    isRoundOpen: true,
    isCloseVotingEnabled: true,
    isStartTiebreakEnabled: false,
    tallies: null,
    tie: null,
    isSending: false,
    rejectionMessage: null,
    closeVoting: jest.fn(),
    startTiebreakRound: jest.fn(),
    ...overrides,
  };
}

describe("facilitator final voting screen", () => {
  it("shows the round progress and an enabled close while the round is open", () => {
    screenHook.mockReturnValue(model());

    render(<FacilitatorFinalVotingScreen state={state} />, {
      wrapper: languageWrapper(),
    });

    expect(screen.getByTestId("voted-count")).toHaveTextContent(
      "Round 1 · voted: 24/30",
    );
    expect(screen.getByTestId("close-voting-button")).toBeEnabled();
    expect(
      screen.queryByTestId("closed-round-tallies"),
    ).not.toBeInTheDocument();
    expect(screen.queryByTestId("tie-callout")).not.toBeInTheDocument();
  });

  it("shows the closed round's ranked tallies with the tie callout", () => {
    screenHook.mockReturnValue(
      model({
        isRoundOpen: false,
        isCloseVotingEnabled: false,
        isStartTiebreakEnabled: true,
        tallies: [
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
        ],
        tie: {
          values: [
            { de: "Wert 1", en: "Value 1" },
            { de: "Wert 3", en: "Value 3" },
          ],
          voteCount: 3,
        },
      }),
    );

    render(<FacilitatorFinalVotingScreen state={state} />, {
      wrapper: languageWrapper(),
    });

    expect(screen.queryByTestId("close-voting-button")).not.toBeInTheDocument();
    expect(screen.getByTestId("tally-wert-2")).toHaveTextContent("Value 2");
    expect(screen.getByTestId("tally-wert-2")).toHaveTextContent("9 votes");
    expect(screen.getByTestId("tie-callout")).toHaveTextContent(
      "Tie: Value 1 = Value 3 (3 votes)",
    );
    expect(screen.getByTestId("start-tiebreak-button")).toBeEnabled();
  });

  it("disables the controls while a send is in flight", () => {
    screenHook.mockReturnValue(
      model({
        isSending: true,
        tie: { values: [{ de: "Wert 1", en: "Value 1" }], voteCount: 3 },
        isStartTiebreakEnabled: true,
      }),
    );

    render(<FacilitatorFinalVotingScreen state={state} />, {
      wrapper: languageWrapper(),
    });

    expect(screen.getByTestId("close-voting-button")).toBeDisabled();
    expect(screen.getByTestId("start-tiebreak-button")).toBeDisabled();
  });

  it("shows the rejection message the hook reports", () => {
    screenHook.mockReturnValue(
      model({ rejectionMessage: MessageKey.IntentWrongPhase }),
    );

    render(<FacilitatorFinalVotingScreen state={state} />, {
      wrapper: languageWrapper(),
    });

    expect(screen.getByRole("status")).toBeInTheDocument();
  });
});
