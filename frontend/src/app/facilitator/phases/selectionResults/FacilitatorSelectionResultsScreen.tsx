"use client";

import type { FacilitatorSelectionResultsState } from "../../../../domain/workshopState";
import {
  SelectionResultsView,
  SelectionResultsViewVariant,
} from "../../../SelectionResultsView";
import styles from "./FacilitatorSelectionResultsScreen.module.css";

export function FacilitatorSelectionResultsScreen({
  state,
}: {
  state: FacilitatorSelectionResultsState;
}) {
  return (
    <section className={styles.screen}>
      <SelectionResultsView
        selection={state.selection}
        variant={SelectionResultsViewVariant.Paper}
      />
    </section>
  );
}
