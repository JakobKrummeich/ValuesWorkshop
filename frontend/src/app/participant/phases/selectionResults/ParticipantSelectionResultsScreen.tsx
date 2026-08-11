"use client";

import type { ParticipantSelectionResultsState } from "../../../../domain/workshopState";
import { SelectionResultsView } from "../../../SelectionResultsView";
import styles from "./ParticipantSelectionResultsScreen.module.css";

export function ParticipantSelectionResultsScreen({
  state,
}: {
  state: ParticipantSelectionResultsState;
}) {
  return (
    <section className={styles.screen}>
      <SelectionResultsView selection={state.selection} />
    </section>
  );
}
