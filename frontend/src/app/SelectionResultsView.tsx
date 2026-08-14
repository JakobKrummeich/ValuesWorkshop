"use client";

import { MessageKey } from "../domain/i18n/messages";
import {
  deriveSelectionResultsChart,
  type SelectionResultsSource,
} from "../domain/selectionResults";
import { useTranslation } from "./i18n/useTranslation";
import { SelectionResultsChart } from "./SelectionResultsChart";
import styles from "./SelectionResultsView.module.css";

export function SelectionResultsView({
  selection,
}: {
  selection: SelectionResultsSource;
}) {
  const { translate } = useTranslation();
  const chart = deriveSelectionResultsChart(selection);

  return (
    <div className={styles.results}>
      <h2 className={styles.heading} data-testid="results-heading">
        {translate(MessageKey.SelectionResultsHeading)}
      </h2>
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
