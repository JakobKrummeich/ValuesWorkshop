import { render, screen } from "@testing-library/react";
import { MessageKey } from "../../../../../domain/i18n/messages";
import { Phase } from "../../../../../domain/phases";
import type { ParticipantFinalVotingState } from "../../../../../domain/workshopState";
import { languageWrapper } from "../../../../../testing/languageWrapper";
import { ParticipantFinalVotingScreen } from "../ParticipantFinalVotingScreen";
import { useParticipantFinalVotingScreen } from "../useParticipantFinalVotingScreen";

jest.mock("../useParticipantFinalVotingScreen", () => ({
  useParticipantFinalVotingScreen: jest.fn(),
}));

const screenHook = useParticipantFinalVotingScreen as jest.MockedFunction<
  typeof useParticipantFinalVotingScreen
>;

const state = {
  phase: Phase.FinalVoting,
  revision: 1,
  participantCount: 3,
  voting: {
    roundNumber: 1,
    allotment: 5,
    eligibleValues: [],
    isRoundOpen: true,
    hasVotedThisRound: false,
  },
} as unknown as ParticipantFinalVotingState;

function model(
  overrides: Partial<ReturnType<typeof useParticipantFinalVotingScreen>> = {},
): ReturnType<typeof useParticipantFinalVotingScreen> {
  return {
    showConfirmation: false,
    cards: [
      {
        valueId: "wert-1",
        text: { de: "Wert 1", en: "Value 1" },
        actions: ["We start meetings on time"],
        voteCount: 2,
        canAdd: true,
        canRemove: true,
      },
    ],
    usedVotes: 2,
    allotment: 5,
    canSubmit: false,
    addVote: jest.fn(),
    removeVote: jest.fn(),
    submitVotes: jest.fn(),
    rejectionMessage: null,
    ...overrides,
  };
}

describe("participant final voting screen", () => {
  it("shows the used votes, the cards and a disabled submission", () => {
    screenHook.mockReturnValue(model());

    render(<ParticipantFinalVotingScreen state={state} />, {
      wrapper: languageWrapper(),
    });

    expect(screen.getByTestId("votes-used")).toHaveTextContent(
      "Your votes: 2/5 used",
    );
    expect(screen.getByTestId("vote-card-wert-1")).toHaveTextContent("Value 1");
    expect(screen.getByTestId("vote-card-wert-1")).toHaveTextContent(
      "We start meetings on time",
    );
    expect(screen.getByTestId("submit-votes-button")).toBeDisabled();
    expect(screen.getByTestId("submit-votes-button")).toHaveTextContent(
      "Submit 5 votes",
    );
  });

  it("labels the submission for a single-vote round", () => {
    screenHook.mockReturnValue(model({ allotment: 1 }));

    render(<ParticipantFinalVotingScreen state={state} />, {
      wrapper: languageWrapper(),
    });

    expect(screen.getByTestId("submit-votes-button")).toHaveTextContent(
      "Submit 1 vote",
    );
  });

  it("enables the submission when the hook allows it", () => {
    screenHook.mockReturnValue(model({ canSubmit: true }));

    render(<ParticipantFinalVotingScreen state={state} />, {
      wrapper: languageWrapper(),
    });

    expect(screen.getByTestId("submit-votes-button")).toBeEnabled();
  });

  it("shows the rejection message the hook reports", () => {
    screenHook.mockReturnValue(
      model({ rejectionMessage: MessageKey.IntentInvariantViolated }),
    );

    render(<ParticipantFinalVotingScreen state={state} />, {
      wrapper: languageWrapper(),
    });

    expect(screen.getByRole("status")).toBeInTheDocument();
  });

  it("shows the confirmation instead of the cards once voted", () => {
    screenHook.mockReturnValue(model({ showConfirmation: true }));

    render(<ParticipantFinalVotingScreen state={state} />, {
      wrapper: languageWrapper(),
    });

    expect(
      screen.getByTestId("votes-submitted-confirmation"),
    ).toHaveTextContent("Votes submitted successfully");
    expect(screen.queryByTestId("votes-used")).not.toBeInTheDocument();
  });
});
