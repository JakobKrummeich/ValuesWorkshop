"use client";

import type { CSSProperties } from "react";
import { localizedText } from "../domain/i18n/localizedText";
import type { SelectionResultRow } from "../domain/selectionResults";
import { useTranslation } from "./i18n/useTranslation";
import styles from "./SelectionResultsChartRow.module.css";

function barFraction(fraction: number): CSSProperties {
  return { "--bar-fraction": fraction } as CSSProperties;
}

export function SelectionResultsChartRow({ row }: { row: SelectionResultRow }) {
  const { language } = useTranslation();

  return (
    <div
      className={
        row.isTopValue ? `${styles.row} ${styles.topValue}` : styles.row
      }
      data-testid={`result-row-${row.valueId}`}
      data-top-value={row.isTopValue}
    >
      <span className={styles.label}>{localizedText(language, row.text)}</span>
      <div className={styles.track}>
        <div
          className={styles.bar}
          data-testid={`result-bar-${row.valueId}`}
          style={barFraction(row.barFraction)}
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
