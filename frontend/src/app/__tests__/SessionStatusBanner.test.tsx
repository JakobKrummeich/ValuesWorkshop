import { render, screen } from "@testing-library/react";
import { NEVER } from "rxjs";
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
      connectionText: "Connected",
      phaseText: "Phase 2",
    });

    render(<SessionStatusBanner sessionState={port} />);

    expect(screen.getByTestId("phase")).toHaveTextContent("Phase 2");
    expect(screen.getByTestId("connection")).toHaveTextContent("Connected");
  });

  it("waits visibly until the first state arrives", () => {
    banner.mockReturnValue({
      connectionText: "Connecting",
      phaseText: "Waiting for the workshop\u2026",
    });

    render(<SessionStatusBanner sessionState={port} />);

    expect(screen.getByTestId("phase")).toHaveTextContent(
      "Waiting for the workshop",
    );
  });
});
