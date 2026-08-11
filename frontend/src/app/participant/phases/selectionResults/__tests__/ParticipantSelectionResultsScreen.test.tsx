import { render, screen } from "@testing-library/react";
import { Language } from "../../../../../domain/i18n/language";
import { Phase } from "../../../../../domain/phases";
import type { ParticipantSelectionResultsState } from "../../../../../domain/workshopState";
import { languageWrapper } from "../../../../../testing/languageWrapper";
import { ParticipantSelectionResultsScreen } from "../ParticipantSelectionResultsScreen";

function state(
  selection: Partial<ParticipantSelectionResultsState["selection"]> = {},
): ParticipantSelectionResultsState {
  return {
    phase: Phase.SelectionResults,
    revision: 20,
    participantCount: 3,
    selection: {
      values: [
        { valueId: "trust", text: { de: "Vertrauen", en: "Trust" } },
        { valueId: "courage", text: { de: "Mut", en: "Courage" } },
      ],
      ownSelectedValueIds: ["trust"],
      isSubmitted: true,
      selectionTallies: { trust: 3, courage: 1 },
      topValueIds: ["trust"],
      ...selection,
    },
  };
}

describe("participant selection results screen", () => {
  it("shows the top values heading", () => {
    render(<ParticipantSelectionResultsScreen state={state()} />, {
      wrapper: languageWrapper(),
    });

    expect(screen.getByTestId("results-heading")).toHaveTextContent(
      "Your top values",
    );
  });

  it("charts the tallied values with label, count, and highlight", () => {
    render(<ParticipantSelectionResultsScreen state={state()} />, {
      wrapper: languageWrapper(),
    });

    expect(screen.getByTestId("result-row-trust")).toHaveTextContent("Trust");
    expect(screen.getByTestId("result-count-trust")).toHaveTextContent("3");
    expect(screen.getByTestId("result-row-trust")).toHaveAttribute(
      "data-top-value",
      "true",
    );
    expect(screen.getByTestId("result-row-courage")).toHaveAttribute(
      "data-top-value",
      "false",
    );
  });

  it("speaks German when German is chosen", () => {
    render(<ParticipantSelectionResultsScreen state={state()} />, {
      wrapper: languageWrapper(Language.German),
    });

    expect(screen.getByTestId("results-heading")).toHaveTextContent(
      "Eure Top-Werte",
    );
    expect(screen.getByTestId("result-row-trust")).toHaveTextContent(
      "Vertrauen",
    );
  });

  it("notes when nobody submitted", () => {
    render(
      <ParticipantSelectionResultsScreen
        state={state({ selectionTallies: {}, topValueIds: [] })}
      />,
      { wrapper: languageWrapper() },
    );

    expect(screen.getByTestId("results-empty-note")).toHaveTextContent(
      "Nobody submitted a selection.",
    );
  });
});
