import { render, screen } from "@testing-library/react";
import { languageWrapper } from "../../../../../testing/languageWrapper";
import { ParticipantSelectionResultsScreen } from "../ParticipantSelectionResultsScreen";

describe("participant selection results screen", () => {
  it("shows the shared waiting screen", () => {
    const { container } = render(<ParticipantSelectionResultsScreen />, {
      wrapper: languageWrapper(),
    });

    expect(screen.getByTestId("waiting-screen")).toBeInTheDocument();
    expect(container.querySelector("svg")).toBeInTheDocument();
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
