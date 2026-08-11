import { render, screen } from "@testing-library/react";
import { Language } from "../../domain/i18n/language";
import type { SelectionResultsSource } from "../../domain/selectionResults";
import { languageWrapper } from "../../testing/languageWrapper";
import { SelectionResultsView } from "../SelectionResultsView";

function source(): SelectionResultsSource {
  return {
    values: [
      { valueId: "trust", text: { de: "Vertrauen", en: "Trust" } },
      { valueId: "courage", text: { de: "Mut", en: "Courage" } },
      { valueId: "candor", text: { de: "Offenheit", en: "Candor" } },
    ],
    selectionTallies: { trust: 3, courage: 1, candor: 2 },
    topValueIds: ["trust", "candor"],
  };
}

function wideSource(): SelectionResultsSource {
  const values = Array.from({ length: 24 }, (unused, index) => ({
    valueId: `value-${String(index + 1).padStart(2, "0")}`,
    text: { de: `Wert ${index + 1}`, en: `Value ${index + 1}` },
  }));

  return {
    values,
    selectionTallies: Object.fromEntries(
      values.map((value, index) => [value.valueId, 24 - index]),
    ),
    topValueIds: values.slice(0, 10).map((value) => value.valueId),
  };
}

describe("selection results view", () => {
  it("shows the heading in English", () => {
    render(<SelectionResultsView selection={source()} />, {
      wrapper: languageWrapper(),
    });

    expect(screen.getByTestId("results-heading")).toHaveTextContent(
      "Your top values",
    );
  });

  it("shows the heading in German", () => {
    render(<SelectionResultsView selection={source()} />, {
      wrapper: languageWrapper(Language.German),
    });

    expect(screen.getByTestId("results-heading")).toHaveTextContent(
      "Eure Top-Werte",
    );
  });

  it("lists the selected values by count with their labels", () => {
    render(<SelectionResultsView selection={source()} />, {
      wrapper: languageWrapper(),
    });

    const rows = screen.getAllByTestId(/^result-row-/);

    expect(rows.map((row) => row.dataset.testid)).toEqual([
      "result-row-trust",
      "result-row-candor",
      "result-row-courage",
    ]);
    expect(screen.getByTestId("result-row-trust")).toHaveTextContent("Trust");
    expect(screen.getByTestId("result-count-trust")).toHaveTextContent("3");
    expect(screen.getByTestId("result-count-candor")).toHaveTextContent("2");
  });

  it("labels the values in German", () => {
    render(<SelectionResultsView selection={source()} />, {
      wrapper: languageWrapper(Language.German),
    });

    expect(screen.getByTestId("result-row-trust")).toHaveTextContent(
      "Vertrauen",
    );
  });

  it("highlights exactly the top values", () => {
    render(<SelectionResultsView selection={source()} />, {
      wrapper: languageWrapper(),
    });

    expect(screen.getByTestId("result-row-trust")).toHaveAttribute(
      "data-top-value",
      "true",
    );
    expect(screen.getByTestId("result-row-candor")).toHaveAttribute(
      "data-top-value",
      "true",
    );
    expect(screen.getByTestId("result-row-courage")).toHaveAttribute(
      "data-top-value",
      "false",
    );
  });

  it("sizes the bars against the most-selected value", () => {
    render(<SelectionResultsView selection={source()} />, {
      wrapper: languageWrapper(),
    });

    expect(screen.getByTestId("result-bar-trust")).toHaveStyle(
      "--bar-fraction: 1",
    );
    expect(screen.getByTestId("result-bar-courage")).toHaveStyle(
      "--bar-fraction: 0.3333333333333333",
    );
  });

  it("hints at the values hidden below the cutoff", () => {
    render(<SelectionResultsView selection={wideSource()} />, {
      wrapper: languageWrapper(),
    });

    expect(screen.getAllByTestId(/^result-row-/)).toHaveLength(20);
    expect(screen.getByTestId("hidden-values-hint")).toHaveTextContent(
      "and 4 more",
    );
  });

  it("hints in German", () => {
    render(<SelectionResultsView selection={wideSource()} />, {
      wrapper: languageWrapper(Language.German),
    });

    expect(screen.getByTestId("hidden-values-hint")).toHaveTextContent(
      "und 4 weitere",
    );
  });

  it("omits the hint when every selected value is shown", () => {
    render(<SelectionResultsView selection={source()} />, {
      wrapper: languageWrapper(),
    });

    expect(screen.queryByTestId("hidden-values-hint")).not.toBeInTheDocument();
  });

  it("shows an empty note instead of the chart on zero submissions", () => {
    render(
      <SelectionResultsView
        selection={{
          values: source().values,
          selectionTallies: {},
          topValueIds: [],
        }}
      />,
      { wrapper: languageWrapper() },
    );

    expect(screen.getByTestId("results-empty-note")).toHaveTextContent(
      "Nobody submitted a selection.",
    );
    expect(screen.queryByTestId(/^result-row-/)).not.toBeInTheDocument();
  });

  it("writes the empty note in German", () => {
    render(
      <SelectionResultsView
        selection={{
          values: source().values,
          selectionTallies: {},
          topValueIds: [],
        }}
      />,
      { wrapper: languageWrapper(Language.German) },
    );

    expect(screen.getByTestId("results-empty-note")).toHaveTextContent(
      "Niemand hat eine Auswahl abgegeben.",
    );
  });
});
