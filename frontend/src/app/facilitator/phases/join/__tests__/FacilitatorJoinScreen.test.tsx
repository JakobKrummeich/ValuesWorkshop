import { fireEvent, render, screen } from "@testing-library/react";
import { MessageKey } from "../../../../../domain/i18n/messages";
import { Phase } from "../../../../../domain/phases";
import type { FacilitatorJoinState } from "../../../../../domain/workshopState";
import { languageWrapper } from "../../../../../testing/languageWrapper";
import { FacilitatorJoinScreen } from "../FacilitatorJoinScreen";
import { useFacilitatorJoinScreen } from "../useFacilitatorJoinScreen";

jest.mock("../useFacilitatorJoinScreen", () => ({
  useFacilitatorJoinScreen: jest.fn(),
}));

const joinScreen = useFacilitatorJoinScreen as jest.MockedFunction<
  typeof useFacilitatorJoinScreen
>;

function joinState(
  participants: { participantId: string; displayName: string }[],
): FacilitatorJoinState {
  return {
    revision: 5,
    phase: Phase.Join,
    roster: { participants, participantCount: participants.length },
  };
}

beforeEach(() => {
  joinScreen.mockReturnValue({
    joinUrl: "https://workshop.test/participant?sessionIdentity=abc-123",
    copyOutcome: null,
    copyJoinUrl: jest.fn(),
  });
});

afterEach(() => {
  jest.clearAllMocks();
});

describe("facilitator join screen", () => {
  it("lists the roster with its size", () => {
    render(
      <FacilitatorJoinScreen
        state={joinState([
          { participantId: "p1", displayName: "Ada Lovelace" },
          { participantId: "p2", displayName: "Alan Turing" },
        ])}
      />,
      { wrapper: languageWrapper() },
    );

    const names = screen.getByTestId("joined-names");
    expect(names).toHaveTextContent("Ada Lovelace");
    expect(names).toHaveTextContent("Alan Turing");
    expect(screen.getByTestId("participant-count")).toHaveTextContent(
      "Participants: 2",
    );
  });

  it("says so while nobody has joined", () => {
    render(<FacilitatorJoinScreen state={joinState([])} />, {
      wrapper: languageWrapper(),
    });

    screen.getByText("Nobody has joined yet");
  });

  it("copies the join url when asked", () => {
    const copyJoinUrl = jest.fn();
    joinScreen.mockReturnValue({
      joinUrl: "https://workshop.test/participant?sessionIdentity=abc-123",
      copyOutcome: null,
      copyJoinUrl,
    });

    render(<FacilitatorJoinScreen state={joinState([])} />, {
      wrapper: languageWrapper(),
    });
    fireEvent.click(screen.getByRole("button", { name: "Copy join link" }));

    expect(copyJoinUrl).toHaveBeenCalled();
  });

  it("shows what the copy attempt did", () => {
    joinScreen.mockReturnValue({
      joinUrl: "https://workshop.test/participant?sessionIdentity=abc-123",
      copyOutcome: MessageKey.JoinUrlCopied,
      copyJoinUrl: jest.fn(),
    });

    render(<FacilitatorJoinScreen state={joinState([])} />, {
      wrapper: languageWrapper(),
    });

    screen.getByText("Link copied");
  });

  it("cannot copy while the link carries no session", () => {
    joinScreen.mockReturnValue({
      joinUrl: null,
      copyOutcome: null,
      copyJoinUrl: jest.fn(),
    });

    render(<FacilitatorJoinScreen state={joinState([])} />, {
      wrapper: languageWrapper(),
    });

    expect(
      screen.getByRole("button", { name: "Copy join link" }),
    ).toBeDisabled();
  });
});
