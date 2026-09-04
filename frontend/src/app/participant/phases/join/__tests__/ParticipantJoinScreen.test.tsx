import { render, screen } from "@testing-library/react";
import { Language } from "../../../../../domain/i18n/language";
import { Phase } from "../../../../../domain/phases";
import { languageWrapper } from "../../../../../testing/languageWrapper";
import { ParticipantJoinScreen } from "../ParticipantJoinScreen";

jest.mock("../../../../useCountUp", () => ({
  useCountUp: (target: number) => target,
}));

const state = {
  revision: 3,
  phase: Phase.Join,
  participantCount: 7,
  ownDisplayName: "Ada Lovelace",
} as const;

describe("participant join screen", () => {
  it("welcomes the participant by name over the aurora", () => {
    render(<ParticipantJoinScreen state={state} />, {
      wrapper: languageWrapper(),
    });

    expect(screen.getByTestId("own-display-name")).toHaveTextContent(
      "You are in, Ada Lovelace.",
    );
    screen.getByText("Waiting for the workshop to start", { exact: false });
    screen.getByTestId("waiting-screen");
  });

  it("counts how many people have joined so far", () => {
    render(<ParticipantJoinScreen state={state} />, {
      wrapper: languageWrapper(),
    });

    expect(screen.getByTestId("participant-count")).toHaveTextContent(
      "Participants: 7",
    );
    screen.getByText("7");
    screen.getByText("joined");
  });

  it("speaks German when German is chosen", () => {
    render(<ParticipantJoinScreen state={state} />, {
      wrapper: languageWrapper(Language.German),
    });

    screen.getByText("Teilnehmende: 7");
    screen.getByText("dabei");
  });
});
