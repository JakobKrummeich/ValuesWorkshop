import { render, screen } from "@testing-library/react";
import { NEVER } from "rxjs";
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

const shell = useFacilitatorShell as jest.MockedFunction<
  typeof useFacilitatorShell
>;

const port = { workshopState: NEVER, connectionState: NEVER };

describe("facilitator shell", () => {
  beforeEach(() => {
    shell.mockReturnValue({
      phase: Phase.GroupWork,
      connectionState: ConnectionState.Connected,
      heading: "Facilitator",
      title: "Group work",
      participantsLabel: "Participants",
      participantCount: "12",
    });
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
    screen.getByRole("button", { name: "advance" });
    expect(screen.getByTestId("phase")).toHaveTextContent("Phase 6");
    expect(screen.getByTestId("connection")).toHaveTextContent("Connected");
  });

  it("shows the participant count next to its label", () => {
    render(
      <FacilitatorShell sessionStatePort={port}>
        <p>phase content</p>
      </FacilitatorShell>,
      { wrapper: languageWrapper() },
    );

    expect(screen.getByRole("term")).toHaveTextContent("Participants");
    expect(screen.getByRole("definition")).toHaveTextContent("12");
  });
});
