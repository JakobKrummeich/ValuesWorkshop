import { render, screen } from "@testing-library/react";
import { NEVER } from "rxjs";
import { ConnectionState } from "../../domain/connectionState";
import { Phase } from "../../domain/phases";
import { SessionStatusBanner } from "../SessionStatusBanner";
import { useSessionStatusBanner } from "../useSessionStatusBanner";

jest.mock("../useSessionStatusBanner", () => ({
  useSessionStatusBanner: jest.fn(),
}));

const banner = useSessionStatusBanner as jest.MockedFunction<
  typeof useSessionStatusBanner
>;

const port = { workshopState: NEVER, connectionState: NEVER };

describe("session status banner", () => {
  it("renders the phase and the connection state", () => {
    banner.mockReturnValue({
      connectionState: ConnectionState.Connected,
      phase: Phase.Quiz,
    });

    render(<SessionStatusBanner sessionState={port} />);

    expect(screen.getByTestId("phase")).toHaveTextContent("Phase 2");
    expect(screen.getByTestId("connection")).toHaveTextContent("connected");
  });

  it("waits visibly until the first state arrives", () => {
    banner.mockReturnValue({
      connectionState: ConnectionState.Connecting,
      phase: null,
    });

    render(<SessionStatusBanner sessionState={port} />);

    expect(screen.getByTestId("phase")).toHaveTextContent(
      "Waiting for the workshop",
    );
  });
});
