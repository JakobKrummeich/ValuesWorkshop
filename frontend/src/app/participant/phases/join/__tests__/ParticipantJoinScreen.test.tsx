import { render, screen } from "@testing-library/react";
import { Language } from "../../../../../domain/i18n/language";
import { Phase } from "../../../../../domain/phases";
import { languageWrapper } from "../../../../../testing/languageWrapper";
import { ParticipantJoinScreen } from "../ParticipantJoinScreen";

const state = {
  revision: 3,
  phase: Phase.Join,
  participantCount: 7,
  ownDisplayName: "Ada Lovelace",
} as const;

describe("participant join screen", () => {
  it("confirms the name the workshop knows the participant by", () => {
    render(<ParticipantJoinScreen state={state} />, {
      wrapper: languageWrapper(),
    });

    screen.getByText("Ada Lovelace", { exact: false });
    screen.getByText("Waiting for the workshop to start", { exact: false });
  });

  it("shows how many people have joined so far", () => {
    render(<ParticipantJoinScreen state={state} />, {
      wrapper: languageWrapper(),
    });

    screen.getByText("Participants: 7");
  });

  it("speaks German when German is chosen", () => {
    render(<ParticipantJoinScreen state={state} />, {
      wrapper: languageWrapper(Language.German),
    });

    screen.getByText("Teilnehmende: 7");
  });
});
