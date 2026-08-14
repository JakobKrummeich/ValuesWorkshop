"use client";

import type { PresenterSelectionResultsState } from "../../../../domain/workshopState";
import { SelectionResultsView } from "../../../SelectionResultsView";
import styles from "./PresenterSelectionResultsScreen.module.css";

export function PresenterSelectionResultsScreen({
  state,
}: {
  state: PresenterSelectionResultsState;
}) {
  return (
    <section className={styles.screen}>
      <SelectionResultsView selection={state.selection} />
    </section>
  );
}
