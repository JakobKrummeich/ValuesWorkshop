"use client";

import type { SelectionResultRow } from "../domain/selectionResults";
import { useRevealChoreography } from "./useRevealChoreography";

export interface StaggeredResultRow {
  row: SelectionResultRow;
  index: number;
}

export interface SelectionResultsChartModel {
  labelsVisible: boolean;
  columns: StaggeredResultRow[][];
}

export function useSelectionResultsChart(
  columns: SelectionResultRow[][],
): SelectionResultsChartModel {
  const rowCount = columns.reduce((count, column) => count + column.length, 0);
  const { labelsVisible } = useRevealChoreography(rowCount);
  let index = 0;

  return {
    labelsVisible,
    columns: columns.map((column) =>
      column.map((row) => ({ row, index: index++ })),
    ),
  };
}
