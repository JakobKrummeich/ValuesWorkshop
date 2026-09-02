import { render, screen } from "@testing-library/react";
import { languageWrapper } from "../../../../../testing/languageWrapper";
import { ParticipantSelectionResultsScreen } from "../ParticipantSelectionResultsScreen";

describe("participant selection results screen", () => {
  it("sends the eyes to the wall where the results are", () => {
    render(<ParticipantSelectionResultsScreen />, {
      wrapper: languageWrapper(),
    });

    expect(screen.getByTestId("waiting-screen")).toHaveTextContent(
      "Eyes up front",
    );
    expect(screen.getByTestId("waiting-screen")).toHaveTextContent(
      "The results are on the screen.",
    );
  });
});
