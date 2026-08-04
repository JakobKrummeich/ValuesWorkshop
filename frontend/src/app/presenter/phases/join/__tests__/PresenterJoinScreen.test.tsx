import { render, screen } from "@testing-library/react";
import { Phase } from "../../../../../domain/phases";
import type { PresenterJoinState } from "../../../../../domain/workshopState";
import { languageWrapper } from "../../../../../testing/languageWrapper";
import { PresenterJoinScreen } from "../PresenterJoinScreen";
import { usePresenterJoinScreen } from "../usePresenterJoinScreen";

jest.mock("../usePresenterJoinScreen", () => ({
  usePresenterJoinScreen: jest.fn(),
}));

const joinScreen = usePresenterJoinScreen as jest.MockedFunction<
  typeof usePresenterJoinScreen
>;

const JOIN_URL = "https://workshop.test/participant?sessionIdentity=abc-123";

const state: PresenterJoinState = {
  revision: 2,
  phase: Phase.Join,
  participantCount: 0,
  participantDisplayNames: [],
};

afterEach(() => {
  jest.clearAllMocks();
});

describe("presenter join screen", () => {
  it("shows a QR code of the participant join url and no readable url", () => {
    joinScreen.mockReturnValue({
      joinUrl: JOIN_URL,
      displayNames: [],
      participantCount: 0,
    });

    render(<PresenterJoinScreen state={state} />, {
      wrapper: languageWrapper(),
    });

    screen.getByTitle("Scan to join");
    expect(screen.queryByText(/workshop\.test/)).not.toBeInTheDocument();
  });

  it("lists everyone who has joined so far", () => {
    joinScreen.mockReturnValue({
      joinUrl: JOIN_URL,
      displayNames: ["Ada Lovelace", "Alan Turing"],
      participantCount: 2,
    });

    render(<PresenterJoinScreen state={state} />, {
      wrapper: languageWrapper(),
    });

    const names = screen.getByTestId("joined-names");
    expect(names).toHaveTextContent("Ada Lovelace");
    expect(names).toHaveTextContent("Alan Turing");
    expect(screen.getByTestId("participant-count")).toHaveTextContent(
      "Participants: 2",
    );
  });

  it("says so while nobody has joined", () => {
    joinScreen.mockReturnValue({
      joinUrl: JOIN_URL,
      displayNames: [],
      participantCount: 0,
    });

    render(<PresenterJoinScreen state={state} />, {
      wrapper: languageWrapper(),
    });

    screen.getByText("Nobody has joined yet");
    expect(screen.queryByTestId("joined-names")).not.toBeInTheDocument();
  });

  it("shows no QR code while the link carries no session", () => {
    joinScreen.mockReturnValue({
      joinUrl: null,
      displayNames: [],
      participantCount: 0,
    });

    render(<PresenterJoinScreen state={state} />, {
      wrapper: languageWrapper(),
    });

    expect(screen.queryByTitle("Scan to join")).not.toBeInTheDocument();
  });
});
