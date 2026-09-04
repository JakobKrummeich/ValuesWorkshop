import { render, screen } from "@testing-library/react";
import { Language } from "../../../../../domain/i18n/language";
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
        actions: [{ id: "0", text: "We start meetings on time" }],
        voteCount: 2,
        canAdd: true,
        canRemove: true,
      },
    ],
    usedVotes: 2,
    remainingVotes: 3,
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
    expect(screen.getByTestId("votes-left-hint")).toHaveTextContent(
      "3 votes left",
    );
  });

  it("heads the ballot with one pip per vote, filled as they are used", () => {
    screenHook.mockReturnValue(model());

    render(<ParticipantFinalVotingScreen state={state} />, {
      wrapper: languageWrapper(),
    });

    screen.getByRole("heading", { name: "Your votes" });
    expect(screen.getByTestId("vote-pips").children).toHaveLength(5);
    expect(
      screen.getByTestId("vote-pips").querySelectorAll('[data-filled="true"]'),
    ).toHaveLength(2);
  });

  it("hints the last vote in the singular", () => {
    screenHook.mockReturnValue(model({ usedVotes: 4, remainingVotes: 1 }));

    render(<ParticipantFinalVotingScreen state={state} />, {
      wrapper: languageWrapper(),
    });

    expect(screen.getByTestId("votes-left-hint")).toHaveTextContent(
      "1 vote left",
    );
  });

  it("drops the hint once every vote is placed", () => {
    screenHook.mockReturnValue(
      model({ usedVotes: 5, remainingVotes: 0, canSubmit: true }),
    );

    render(<ParticipantFinalVotingScreen state={state} />, {
      wrapper: languageWrapper(),
    });

    expect(screen.queryByTestId("votes-left-hint")).not.toBeInTheDocument();
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

  it("speaks German when German is chosen", () => {
    screenHook.mockReturnValue(model());

    render(<ParticipantFinalVotingScreen state={state} />, {
      wrapper: languageWrapper(Language.German),
    });

    screen.getByRole("heading", { name: "Deine Stimmen" });
    expect(screen.getByTestId("votes-used")).toHaveTextContent(
      "Deine Stimmen: 2/5 vergeben",
    );
    expect(screen.getByTestId("votes-left-hint")).toHaveTextContent(
      "Noch 3 Stimmen",
    );
  });
});
