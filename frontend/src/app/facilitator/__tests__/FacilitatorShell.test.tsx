import { render, screen } from "@testing-library/react";
import { NEVER, of } from "rxjs";
import { ConnectionState } from "../../../domain/connectionState";
import { Phase } from "../../../domain/phases";
import { languageWrapper } from "../../../testing/languageWrapper";
import { FacilitatorShell } from "../FacilitatorShell";
import { useFacilitatorShell } from "../useFacilitatorShell";

jest.mock("../useFacilitatorShell", () => ({
  useFacilitatorShell: jest.fn(),
}));
jest.mock("../AdvancePhaseButton", () => ({
  AdvancePhaseButton: () => <button type="button">advance</button>,
}));
jest.mock("../AdvanceGuard", () => ({
  AdvanceGuard: () => <p>guard</p>,
}));

const shell = useFacilitatorShell as jest.MockedFunction<
  typeof useFacilitatorShell
>;

const port = {
  workshopState: NEVER,
  connectionState: of(ConnectionState.Connected),
};

function shellResult(sessionCode: string | null) {
  return {
    phase: Phase.GroupWork,
    heading: "Facilitator",
    title: "Group work",
    sessionCodeLabel: "Session",
    sessionCode,
    participantsLabel: "Participants",
    participantCount: "12",
  };
}

describe("facilitator shell", () => {
  beforeEach(() => {
    shell.mockReturnValue(shellResult("3f2a9c1b"));
  });

  it("frames the phase content with sidebar, title and bottom bar", () => {
    render(
      <FacilitatorShell sessionStatePort={port}>
        <p>phase content</p>
      </FacilitatorShell>,
      { wrapper: languageWrapper() },
    );

    screen.getByRole("heading", { level: 1, name: "Group work" });
    screen.getByRole("heading", { level: 2, name: "Facilitator" });
    screen.getByText("phase content");
    screen.getByText("guard");
    screen.getByRole("button", { name: "advance" });
    expect(screen.getByTestId("phase")).toHaveTextContent("Phase 6");
    expect(screen.getByTestId("connection")).toHaveTextContent("Connected");
  });

  it("shows the session code and the participant count next to their labels", () => {
    render(
      <FacilitatorShell sessionStatePort={port}>
        <p>phase content</p>
      </FacilitatorShell>,
      { wrapper: languageWrapper() },
    );

    const [sessionLabel, participantsLabel] = screen.getAllByRole("term");
    const [sessionCode, participantCount] = screen.getAllByRole("definition");
    expect(sessionLabel).toHaveTextContent("Session");
    expect(sessionCode).toHaveTextContent("3f2a9c1b");
    expect(participantsLabel).toHaveTextContent("Participants");
    expect(participantCount).toHaveTextContent("12");
  });

  it("leaves the session code out while the link carries none", () => {
    shell.mockReturnValue(shellResult(null));

    render(
      <FacilitatorShell sessionStatePort={port}>
        <p>phase content</p>
      </FacilitatorShell>,
      { wrapper: languageWrapper() },
    );

    expect(screen.getAllByRole("term")).toHaveLength(1);
    expect(screen.queryByText("Session")).not.toBeInTheDocument();
  });
});
