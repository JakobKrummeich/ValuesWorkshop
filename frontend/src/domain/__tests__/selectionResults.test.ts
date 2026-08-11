import {
  deriveSelectionResultsChart,
  type SelectionResultsSource,
} from "../selectionResults";

function catalogValue(valueId: string) {
  return { valueId, text: { de: `${valueId}-de`, en: `${valueId}-en` } };
}

function catalog(count: number) {
  return Array.from({ length: count }, (unused, index) =>
    catalogValue(`value-${String(index + 1).padStart(2, "0")}`),
  );
}

function rows(chart: ReturnType<typeof deriveSelectionResultsChart>) {
  return chart.columns.flat();
}

describe("deriveSelectionResultsChart", () => {
  it("orders rows by count descending, then catalog order", () => {
    const source: SelectionResultsSource = {
      values: [
        catalogValue("alpha"),
        catalogValue("bravo"),
        catalogValue("charlie"),
      ],
      selectionTallies: { alpha: 1, bravo: 3, charlie: 1 },
      topValueIds: ["bravo", "alpha", "charlie"],
    };

    expect(
      rows(deriveSelectionResultsChart(source)).map((row) => row.valueId),
    ).toEqual(["bravo", "alpha", "charlie"]);
  });

  it("omits values nobody selected", () => {
    const source: SelectionResultsSource = {
      values: [catalogValue("alpha"), catalogValue("bravo")],
      selectionTallies: { bravo: 2 },
      topValueIds: ["bravo"],
    };

    expect(
      rows(deriveSelectionResultsChart(source)).map((row) => row.valueId),
    ).toEqual(["bravo"]);
  });

  it("carries the localized text and count onto each row", () => {
    const source: SelectionResultsSource = {
      values: [catalogValue("alpha")],
      selectionTallies: { alpha: 4 },
      topValueIds: ["alpha"],
    };

    expect(rows(deriveSelectionResultsChart(source))).toEqual([
      {
        valueId: "alpha",
        text: { de: "alpha-de", en: "alpha-en" },
        count: 4,
        barFraction: 1,
        isTopValue: true,
      },
    ]);
  });

  it("scales bars against the most-selected value", () => {
    const source: SelectionResultsSource = {
      values: [
        catalogValue("alpha"),
        catalogValue("bravo"),
        catalogValue("charlie"),
      ],
      selectionTallies: { alpha: 4, bravo: 2, charlie: 1 },
      topValueIds: ["alpha", "bravo", "charlie"],
    };

    expect(
      rows(deriveSelectionResultsChart(source)).map((row) => row.barFraction),
    ).toEqual([1, 0.5, 0.25]);
  });

  it("marks only members of the top set as top values", () => {
    const source: SelectionResultsSource = {
      values: [catalogValue("alpha"), catalogValue("bravo")],
      selectionTallies: { alpha: 3, bravo: 1 },
      topValueIds: ["alpha"],
    };

    expect(
      rows(deriveSelectionResultsChart(source)).map((row) => row.isTopValue),
    ).toEqual([true, false]);
  });

  it("cuts the chart off at twenty rows and counts the hidden values", () => {
    const values = catalog(25);
    const selectionTallies = Object.fromEntries(
      values.map((value, index) => [value.valueId, 25 - index]),
    );
    const source: SelectionResultsSource = {
      values,
      selectionTallies,
      topValueIds: values.slice(0, 10).map((value) => value.valueId),
    };

    const chart = deriveSelectionResultsChart(source);

    expect(rows(chart)).toHaveLength(20);
    expect(chart.hiddenValueCount).toBe(5);
  });

  it("grows past twenty rows when the widened top set is larger", () => {
    const values = catalog(30);
    const selectionTallies = Object.fromEntries(
      values.map((value, index) => [value.valueId, index < 22 ? 5 : 1]),
    );
    const source: SelectionResultsSource = {
      values,
      selectionTallies,
      topValueIds: values.slice(0, 22).map((value) => value.valueId),
    };

    const chart = deriveSelectionResultsChart(source);

    expect(rows(chart)).toHaveLength(22);
    expect(chart.hiddenValueCount).toBe(8);
  });

  it("omits the hidden count when every selected value is shown", () => {
    const source: SelectionResultsSource = {
      values: catalog(3),
      selectionTallies: { "value-01": 1, "value-02": 1, "value-03": 1 },
      topValueIds: ["value-01", "value-02", "value-03"],
    };

    expect(deriveSelectionResultsChart(source).hiddenValueCount).toBe(0);
  });

  it("splits twenty rows into two columns of ten, left first", () => {
    const values = catalog(20);
    const selectionTallies = Object.fromEntries(
      values.map((value, index) => [value.valueId, 20 - index]),
    );
    const source: SelectionResultsSource = {
      values,
      selectionTallies,
      topValueIds: values.slice(0, 10).map((value) => value.valueId),
    };

    const chart = deriveSelectionResultsChart(source);

    expect(chart.columns).toHaveLength(2);
    expect(chart.columns[0].map((row) => row.valueId)).toEqual(
      values.slice(0, 10).map((value) => value.valueId),
    );
    expect(chart.columns[1].map((row) => row.valueId)).toEqual(
      values.slice(10).map((value) => value.valueId),
    );
  });

  it("keeps a first column of ten while the second column runs short", () => {
    const values = catalog(12);
    const selectionTallies = Object.fromEntries(
      values.map((value) => [value.valueId, 1]),
    );
    const source: SelectionResultsSource = {
      values,
      selectionTallies,
      topValueIds: values.slice(0, 12).map((value) => value.valueId),
    };

    const chart = deriveSelectionResultsChart(source);

    expect(chart.columns.map((column) => column.length)).toEqual([10, 2]);
  });

  it("uses a single column for ten or fewer rows", () => {
    const source: SelectionResultsSource = {
      values: catalog(4),
      selectionTallies: {
        "value-01": 2,
        "value-02": 1,
        "value-03": 1,
        "value-04": 1,
      },
      topValueIds: ["value-01", "value-02", "value-03", "value-04"],
    };

    expect(deriveSelectionResultsChart(source).columns).toHaveLength(1);
  });

  it("balances the columns when the chart grows past twenty rows", () => {
    const values = catalog(23);
    const selectionTallies = Object.fromEntries(
      values.map((value) => [value.valueId, 1]),
    );
    const source: SelectionResultsSource = {
      values,
      selectionTallies,
      topValueIds: values.map((value) => value.valueId),
    };

    const chart = deriveSelectionResultsChart(source);

    expect(chart.columns.map((column) => column.length)).toEqual([12, 11]);
  });

  it("renders empty on zero submissions", () => {
    const source: SelectionResultsSource = {
      values: catalog(3),
      selectionTallies: {},
      topValueIds: [],
    };

    expect(deriveSelectionResultsChart(source)).toEqual({
      columns: [],
      hiddenValueCount: 0,
    });
  });

  it("renders empty when the wire omits tallies and top values", () => {
    const source: SelectionResultsSource = { values: catalog(3) };

    expect(deriveSelectionResultsChart(source)).toEqual({
      columns: [],
      hiddenValueCount: 0,
    });
  });
});
