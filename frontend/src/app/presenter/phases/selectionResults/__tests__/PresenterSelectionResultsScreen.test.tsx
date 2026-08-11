import { render, screen } from "@testing-library/react";
import { Language } from "../../../../../domain/i18n/language";
import { Phase } from "../../../../../domain/phases";
import type { PresenterSelectionResultsState } from "../../../../../domain/workshopState";
import { languageWrapper } from "../../../../../testing/languageWrapper";
import { PresenterSelectionResultsScreen } from "../PresenterSelectionResultsScreen";

function values(count: number) {
  return Array.from({ length: count }, (unused, index) => ({
    valueId: `value-${String(index + 1).padStart(2, "0")}`,
    text: { de: `Wert ${index + 1}`, en: `Value ${index + 1}` },
  }));
}

function state(
  selection: Partial<PresenterSelectionResultsState["selection"]> = {},
): PresenterSelectionResultsState {
  return {
    phase: Phase.SelectionResults,
    revision: 20,
    participantCount: 3,
    selection: {
      values: [
        { valueId: "trust", text: { de: "Vertrauen", en: "Trust" } },
        { valueId: "courage", text: { de: "Mut", en: "Courage" } },
      ],
      submittedCount: 3,
      selectionTallies: { trust: 3, courage: 1 },
      topValueIds: ["trust"],
      ...selection,
    },
  };
}

describe("presenter selection results screen", () => {
  it("shows the top values heading", () => {
    render(<PresenterSelectionResultsScreen state={state()} />, {
      wrapper: languageWrapper(),
    });

    expect(screen.getByTestId("results-heading")).toHaveTextContent(
      "Your top values",
    );
  });

  it("charts the tallied values with label, count, and highlight", () => {
    render(<PresenterSelectionResultsScreen state={state()} />, {
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

  it("hints at values hidden below the cutoff", () => {
    const catalog = values(24);

    render(
      <PresenterSelectionResultsScreen
        state={state({
          values: catalog,
          selectionTallies: Object.fromEntries(
            catalog.map((value, index) => [value.valueId, 24 - index]),
          ),
          topValueIds: catalog.slice(0, 10).map((value) => value.valueId),
        })}
      />,
      { wrapper: languageWrapper() },
    );

    expect(screen.getAllByTestId(/^result-row-/)).toHaveLength(20);
    expect(screen.getByTestId("hidden-values-hint")).toHaveTextContent(
      "and 4 more",
    );
  });

  it("speaks German when German is chosen", () => {
    render(<PresenterSelectionResultsScreen state={state()} />, {
      wrapper: languageWrapper(Language.German),
    });

    expect(screen.getByTestId("results-heading")).toHaveTextContent(
      "Eure Top-Werte",
    );
  });

  it("notes when nobody submitted", () => {
    render(
      <PresenterSelectionResultsScreen
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
