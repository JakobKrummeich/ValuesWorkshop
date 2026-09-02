"use client";

import type { SelectionResultRow } from "../domain/selectionResults";
import { SelectionResultsChartRow } from "./SelectionResultsChartRow";
import styles from "./SelectionResultsChart.module.css";
import { useSelectionResultsChart } from "./useSelectionResultsChart";

export function SelectionResultsChart({
  columns,
}: {
  columns: SelectionResultRow[][];
}) {
  const chart = useSelectionResultsChart(columns);

  return (
    <div
      className={
        chart.labelsVisible
          ? `${styles.chart} ${styles.labelsVisible}`
          : styles.chart
      }
    >
      {chart.columns.map((column, columnIndex) => (
        <div key={columnIndex} className={styles.column}>
          {column.map(({ row, index }) => (
            <SelectionResultsChartRow
              key={row.valueId}
              row={row}
              index={index}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
