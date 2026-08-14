import type { LocalizedText } from "./i18n/localizedText";

export interface SelectionResultsSource {
  values: { valueId: string; text: LocalizedText }[];
  selectionTallies?: Record<string, number>;
  topValueIds?: string[];
}

export interface SelectionResultRow {
  valueId: string;
  text: LocalizedText;
  count: number;
  barFraction: number;
  isTopValue: boolean;
}

export interface SelectionResultsChart {
  columns: SelectionResultRow[][];
  hiddenValueCount: number;
}

const rowLimit = 20;
const columnCapacity = 10;

export function deriveSelectionResultsChart(
  source: SelectionResultsSource,
): SelectionResultsChart {
  const tallies = source.selectionTallies ?? {};
  const topValueIds = new Set(source.topValueIds ?? []);

  const selectedValues = source.values
    .map((value) => ({ value, count: tallies[value.valueId] ?? 0 }))
    .filter((entry) => entry.count > 0)
    .sort((first, second) => second.count - first.count);

  const visibleValues = selectedValues.slice(
    0,
    Math.max(rowLimit, topValueIds.size),
  );
  const strongestCount = visibleValues[0]?.count ?? 0;

  const rows = visibleValues.map(({ value, count }) => ({
    valueId: value.valueId,
    text: value.text,
    count,
    barFraction: count / strongestCount,
    isTopValue: topValueIds.has(value.valueId),
  }));

  return {
    columns: splitIntoColumns(rows),
    hiddenValueCount: selectedValues.length - visibleValues.length,
  };
}

function splitIntoColumns(rows: SelectionResultRow[]): SelectionResultRow[][] {
  const columnLength = Math.max(columnCapacity, Math.ceil(rows.length / 2));
  const columns: SelectionResultRow[][] = [];

  for (let start = 0; start < rows.length; start += columnLength) {
    columns.push(rows.slice(start, start + columnLength));
  }

  return columns;
}
