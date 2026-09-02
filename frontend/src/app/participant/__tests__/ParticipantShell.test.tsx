import { render, screen } from "@testing-library/react";
import { of } from "rxjs";
import { ConnectionState } from "../../../domain/connectionState";
import { Language } from "../../../domain/i18n/language";
import { Phase } from "../../../domain/phases";
import { QuizSubState } from "../../../domain/workshopState";
import { languageWrapper } from "../../../testing/languageWrapper";
import { ParticipantShell } from "../ParticipantShell";

const port = {
  workshopState: of({
    phase: Phase.Quiz as const,
    revision: 1,
    participantCount: 3,
    quiz: {
      questionIndex: 0,
      questionCount: 3,
      subState: QuizSubState.Answering,
      question: { de: "Wie viele?", en: "How many?" },
      answers: [],
      ownAnswerIndex: null,
    },
  }),
  connectionState: of(ConnectionState.Reconnecting),
};

describe("participant shell", () => {
  it("frames the phase content with the phone header", () => {
    render(
      <ParticipantShell sessionStatePort={port}>
        <p>phase content</p>
      </ParticipantShell>,
      { wrapper: languageWrapper() },
    );

    screen.getByRole("heading", { level: 1, name: "Participant" });
    screen.getByRole("group", { name: "Language" });
    screen.getByText("phase content");
    expect(screen.getByTestId("phase")).toHaveTextContent("Phase 2");
    expect(screen.getByTestId("connection")).toHaveTextContent("Reconnecting");
  });

  it("speaks the chosen language", () => {
    render(
      <ParticipantShell sessionStatePort={port}>
        <p>phase content</p>
      </ParticipantShell>,
      { wrapper: languageWrapper(Language.German) },
    );

    screen.getByRole("heading", { level: 1, name: "Teilnahme" });
  });
});
