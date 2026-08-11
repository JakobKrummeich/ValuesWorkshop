import { render, screen } from "@testing-library/react";
import { Language } from "../../../../../domain/i18n/language";
import { Phase } from "../../../../../domain/phases";
import type { FacilitatorSelectionResultsState } from "../../../../../domain/workshopState";
import { languageWrapper } from "../../../../../testing/languageWrapper";
import { FacilitatorSelectionResultsScreen } from "../FacilitatorSelectionResultsScreen";

function state(
  selection: Partial<FacilitatorSelectionResultsState["selection"]> = {},
): FacilitatorSelectionResultsState {
  return {
    phase: Phase.SelectionResults,
    revision: 20,
    roster: {
      participants: [
        { participantId: "participant-1", displayName: "Ada" },
        { participantId: "participant-2", displayName: "Grace" },
      ],
      participantCount: 2,
    },
    enabledIntents: [],
    selection: {
      values: [
        { valueId: "trust", text: { de: "Vertrauen", en: "Trust" } },
        { valueId: "courage", text: { de: "Mut", en: "Courage" } },
      ],
      submittedCount: 2,
      selectionTallies: { trust: 2, courage: 1 },
      topValueIds: ["trust"],
      ...selection,
    },
  };
}

describe("facilitator selection results screen", () => {
  it("shows the top values heading", () => {
    render(<FacilitatorSelectionResultsScreen state={state()} />, {
      wrapper: languageWrapper(),
    });

    expect(screen.getByTestId("results-heading")).toHaveTextContent(
      "Your top values",
    );
  });

  it("charts the tallied values with label, count, and highlight", () => {
    render(<FacilitatorSelectionResultsScreen state={state()} />, {
      wrapper: languageWrapper(),
    });

    expect(screen.getByTestId("result-row-trust")).toHaveTextContent("Trust");
    expect(screen.getByTestId("result-count-trust")).toHaveTextContent("2");
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
    render(<FacilitatorSelectionResultsScreen state={state()} />, {
      wrapper: languageWrapper(Language.German),
    });

    expect(screen.getByTestId("results-heading")).toHaveTextContent(
      "Eure Top-Werte",
    );
  });

  it("notes when nobody submitted", () => {
    render(
      <FacilitatorSelectionResultsScreen
        state={state({
          submittedCount: 0,
          selectionTallies: {},
          topValueIds: [],
        })}
      />,
      { wrapper: languageWrapper() },
    );

    expect(screen.getByTestId("results-empty-note")).toHaveTextContent(
      "Nobody submitted a selection.",
    );
  });
});
