import { render, screen } from "@testing-library/react";
import { Language } from "../../../../../domain/i18n/language";
import { languageWrapper } from "../../../../../testing/languageWrapper";
import { ParticipantSelectionResultsScreen } from "../ParticipantSelectionResultsScreen";

describe("participant selection results screen", () => {
  it("shows the waiting screen with the pulsating icon", () => {
    const { container } = render(<ParticipantSelectionResultsScreen />, {
      wrapper: languageWrapper(),
    });

    expect(container.querySelector("svg")).toBeInTheDocument();
    expect(screen.getByTestId("results-waiting")).toHaveAccessibleName(
      "Look at the presenter wall",
    );
  });

  it("speaks German when German is chosen", () => {
    render(<ParticipantSelectionResultsScreen />, {
      wrapper: languageWrapper(Language.German),
    });

    expect(screen.getByTestId("results-waiting")).toHaveAccessibleName(
      "Schaut auf die Präsentationswand",
    );
  });

  it("renders no chart elements", () => {
    render(<ParticipantSelectionResultsScreen />, {
      wrapper: languageWrapper(),
    });

    expect(screen.queryByTestId("results-heading")).not.toBeInTheDocument();
    expect(screen.queryByTestId(/^result-row-/)).not.toBeInTheDocument();
    expect(screen.queryByTestId(/^result-count-/)).not.toBeInTheDocument();
    expect(screen.queryByTestId("results-empty-note")).not.toBeInTheDocument();
    expect(screen.queryByTestId("hidden-values-hint")).not.toBeInTheDocument();
  });
});
