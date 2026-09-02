"use client";

import { localizedText } from "../domain/i18n/localizedText";
import type { SelectionResultRow } from "../domain/selectionResults";
import { cssCustomProperty } from "../shared/cssCustomProperty";
import { useTranslation } from "./i18n/useTranslation";
import styles from "./SelectionResultsChartRow.module.css";

export function SelectionResultsChartRow({
  row,
  index,
}: {
  row: SelectionResultRow;
  index: number;
}) {
  const { language } = useTranslation();

  return (
    <div
      className={
        row.isTopValue ? `${styles.row} ${styles.topValue}` : styles.row
      }
      data-testid={`result-row-${row.valueId}`}
      data-top-value={row.isTopValue}
      style={cssCustomProperty("--index", index)}
    >
      <span
        className={styles.label}
        data-testid={`result-label-${row.valueId}`}
      >
        {localizedText(language, row.text)}
      </span>
      <div className={styles.track}>
        <div
          className={styles.bar}
          data-testid={`result-bar-${row.valueId}`}
          style={cssCustomProperty("--bar-fraction", row.barFraction)}
        />
      </div>
      <span
        className={styles.count}
        data-testid={`result-count-${row.valueId}`}
      >
        {row.count}
      </span>
    </div>
  );
}
