"use client";

import type { SelectionResultRow } from "../domain/selectionResults";
import { SelectionResultsChartRow } from "./SelectionResultsChartRow";
import styles from "./SelectionResultsChart.module.css";

export function SelectionResultsChart({
  columns,
}: {
  columns: SelectionResultRow[][];
}) {
  return (
    <div className={styles.chart}>
      {columns.map((column, columnIndex) => (
        <div key={columnIndex} className={styles.column}>
          {column.map((row) => (
            <SelectionResultsChartRow key={row.valueId} row={row} />
          ))}
        </div>
      ))}
    </div>
  );
}
