import { render, screen } from "@testing-library/react";
import { participantJoinUrl } from "../../../../../adapters/browserLocation";
import { Phase } from "../../../../../domain/phases";
import type { PresenterJoinState } from "../../../../../domain/workshopState";
import { languageWrapper } from "../../../../../testing/languageWrapper";
import { PresenterJoinScreen } from "../PresenterJoinScreen";

jest.mock("../../../../../adapters/browserLocation", () => ({
  participantJoinUrl: jest.fn(),
}));

const joinUrl = participantJoinUrl as jest.MockedFunction<
  typeof participantJoinUrl
>;

function joinState(displayNames: string[]): PresenterJoinState {
  return {
    revision: 2,
    phase: Phase.Join,
    participantCount: displayNames.length,
    participantDisplayNames: displayNames,
  };
}

beforeEach(() => {
  joinUrl.mockReturnValue(
    "https://workshop.test/participant?sessionIdentity=abc-123",
  );
});

afterEach(() => {
  jest.clearAllMocks();
});

describe("presenter join screen", () => {
  it("shows a QR code of the participant join url and no readable url", () => {
    render(<PresenterJoinScreen state={joinState([])} />, {
      wrapper: languageWrapper(),
    });

    screen.getByTitle("Scan to join");
    expect(screen.queryByText(/workshop\.test/)).not.toBeInTheDocument();
  });

  it("lists everyone who has joined so far", () => {
    render(
      <PresenterJoinScreen
        state={joinState(["Ada Lovelace", "Alan Turing"])}
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
    render(<PresenterJoinScreen state={joinState([])} />, {
      wrapper: languageWrapper(),
    });

    screen.getByText("Nobody has joined yet");
    expect(screen.queryByTestId("joined-names")).not.toBeInTheDocument();
  });

  it("shows no QR code while the link carries no session", () => {
    joinUrl.mockReturnValue(null);

    render(<PresenterJoinScreen state={joinState([])} />, {
      wrapper: languageWrapper(),
    });

    expect(screen.queryByTitle("Scan to join")).not.toBeInTheDocument();
  });
});
