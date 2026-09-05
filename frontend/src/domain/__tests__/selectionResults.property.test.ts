import fc from "fast-check";
import {
  deriveSelectionResultsChart,
  type SelectionResultsSource,
} from "../selectionResults";

const rowLimit = 20;

const sources = fc
  .uniqueArray(fc.integer({ min: 1, max: 60 }), {
    minLength: 1,
    maxLength: 40,
  })
  .map((numbers) => numbers.map((number) => `value-${number}`))
  .chain((valueIds) =>
    fc.record({
      values: fc.constant(
        valueIds.map((valueId) => ({
          valueId,
          text: { de: `${valueId}-de`, en: `${valueId}-en` },
        })),
      ),
      selectionTallies: fc.dictionary(
        fc.constantFrom(...valueIds),
        fc.integer({ min: 0, max: 30 }),
      ),
      topValueIds: fc.subarray(valueIds),
    }),
  );

function rowsOf(source: SelectionResultsSource) {
  return deriveSelectionResultsChart(source).columns.flat();
}

function selectedValueIdsOf(source: SelectionResultsSource) {
  return source.values
    .map((value) => value.valueId)
    .filter((valueId) => (source.selectionTallies?.[valueId] ?? 0) > 0);
}

describe("the selection results chart, for any tally", () => {
  it("shows every value on the chart at most once and only if it was selected", () => {
    fc.assert(
      fc.property(sources, (source) => {
        const shownValueIds = rowsOf(source).map((row) => row.valueId);
        const selectedValueIds = selectedValueIdsOf(source);

        expect(new Set(shownValueIds).size).toBe(shownValueIds.length);
        expect(
          shownValueIds.every((valueId) => selectedValueIds.includes(valueId)),
        ).toBe(true);
      }),
    );
  });

  it("accounts for every selected value, on the chart or as hidden", () => {
    fc.assert(
      fc.property(sources, (source) => {
        const chart = deriveSelectionResultsChart(source);

        expect(chart.columns.flat().length + chart.hiddenValueCount).toBe(
          selectedValueIdsOf(source).length,
        );
        expect(chart.hiddenValueCount).toBeGreaterThanOrEqual(0);
      }),
    );
  });

  it("orders the rows by count, strongest first", () => {
    fc.assert(
      fc.property(sources, (source) => {
        const counts = rowsOf(source).map((row) => row.count);

        expect(counts.every((count) => count > 0)).toBe(true);
        expect([...counts].sort((first, second) => second - first)).toEqual(
          counts,
        );
      }),
    );
  });

  it("draws every bar as a fraction of the strongest one", () => {
    fc.assert(
      fc.property(sources, (source) => {
        const rows = rowsOf(source);
        const strongestRow = rows.at(0);

        expect(
          rows.every((row) => row.barFraction > 0 && row.barFraction <= 1),
        ).toBe(true);
        expect(
          strongestRow === undefined || strongestRow.barFraction === 1,
        ).toBe(true);
      }),
    );
  });

  it("fills the row limit, widened by the top set, before hiding anything", () => {
    fc.assert(
      fc.property(sources, (source) => {
        const visibleLimit = Math.max(
          rowLimit,
          new Set(source.topValueIds).size,
        );

        expect(rowsOf(source).length).toBe(
          Math.min(selectedValueIdsOf(source).length, visibleLimit),
        );
      }),
    );
  });

  it("never needs more than two columns and never draws an empty one", () => {
    fc.assert(
      fc.property(sources, (source) => {
        const chart = deriveSelectionResultsChart(source);

        expect(chart.columns.length).toBeLessThanOrEqual(2);
        expect(chart.columns.every((column) => column.length > 0)).toBe(true);
      }),
    );
  });

  it("marks a row as a top value exactly when the source says so", () => {
    fc.assert(
      fc.property(sources, (source) => {
        const topValueIds = new Set(source.topValueIds);

        expect(
          rowsOf(source).every(
            (row) => row.isTopValue === topValueIds.has(row.valueId),
          ),
        ).toBe(true);
      }),
    );
  });
});
