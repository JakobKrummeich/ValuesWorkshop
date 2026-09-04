"use client";

import { MessageKey } from "../domain/i18n/messages";
import {
  deriveSelectionResultsChart,
  type SelectionResultsSource,
} from "../domain/selectionResults";
import { Eyebrow } from "./Eyebrow";
import { useTranslation } from "./i18n/useTranslation";
import { SelectionResultsChart } from "./SelectionResultsChart";
import styles from "./SelectionResultsView.module.css";

export enum SelectionResultsViewVariant {
  Wall = "wall",
  Paper = "paper",
}

export function SelectionResultsView({
  selection,
  variant,
}: {
  selection: SelectionResultsSource;
  variant: SelectionResultsViewVariant;
}) {
  const { translate } = useTranslation();
  const chart = deriveSelectionResultsChart(selection);

  return (
    <div className={`${styles.results} ${styles[variant]}`}>
      <Eyebrow className={styles.heading} testId="results-heading">
        {translate(MessageKey.SelectionResultsHeading)}
      </Eyebrow>
      {chart.columns.length === 0 ? (
        <p className={styles.emptyNote} data-testid="results-empty-note">
          {translate(MessageKey.SelectionResultsNoSubmissions)}
        </p>
      ) : (
        <SelectionResultsChart columns={chart.columns} />
      )}
      {chart.hiddenValueCount > 0 && (
        <p className={styles.hiddenValuesHint} data-testid="hidden-values-hint">
          {translate(MessageKey.SelectionResultsHiddenValues, {
            count: chart.hiddenValueCount,
          })}
        </p>
      )}
    </div>
  );
}
