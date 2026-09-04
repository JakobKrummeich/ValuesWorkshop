import { render, screen } from "@testing-library/react";
import { Language } from "../../../../../domain/i18n/language";
import { Phase } from "../../../../../domain/phases";
import type { PresenterSelectionState } from "../../../../../domain/workshopState";
import { languageWrapper } from "../../../../../testing/languageWrapper";
import { PresenterSelectionScreen } from "../PresenterSelectionScreen";

function state(submittedCount: number): PresenterSelectionState {
  return {
    phase: Phase.ValueSelection,
    revision: 11,
    participantCount: 30,
    selection: {
      values: [{ valueId: "trust", text: { de: "Vertrauen", en: "Trust" } }],
      submittedCount,
    },
  };
}

describe("presenter selection screen", () => {
  it("shows the wall prompt without any value list", () => {
    render(<PresenterSelectionScreen state={state(0)} />, {
      wrapper: languageWrapper(),
    });

    screen.getByText("Pick your 10 values");
    expect(screen.queryByText("Trust")).not.toBeInTheDocument();
  });

  it("shows the submission progress against the participant count", () => {
    render(<PresenterSelectionScreen state={state(19)} />, {
      wrapper: languageWrapper(),
    });

    expect(screen.getByTestId("submitted-count")).toHaveTextContent(
      "19 of 30 have submitted",
    );
  });

  it("starts the progress at zero", () => {
    render(<PresenterSelectionScreen state={state(0)} />, {
      wrapper: languageWrapper(),
    });

    expect(screen.getByTestId("submitted-count")).toHaveTextContent(
      "0 of 30 have submitted",
    );
  });

  it("reports a complete submission round with a full bar", () => {
    render(<PresenterSelectionScreen state={state(30)} />, {
      wrapper: languageWrapper(),
    });

    expect(screen.getByTestId("submitted-count")).toHaveTextContent(
      "30 of 30 have submitted",
    );
    expect(screen.getByTestId("selection-progress-bar")).toHaveStyle({
      "--progress": "1",
    });
    expect(screen.getByRole("progressbar")).toHaveAttribute(
      "aria-valuenow",
      "100",
    );
  });

  it("speaks German when German is chosen", () => {
    render(<PresenterSelectionScreen state={state(19)} />, {
      wrapper: languageWrapper(Language.German),
    });

    screen.getByText("Wählt eure 10 Werte");
    expect(screen.getByTestId("submitted-count")).toHaveTextContent(
      "19 von 30 haben abgegeben",
    );
  });
});
