"use client";

import { MessageKey } from "../../../../domain/i18n/messages";
import type { PresenterSelectionState } from "../../../../domain/workshopState";
import { useTranslation } from "../../../i18n/useTranslation";
import styles from "./PresenterSelectionScreen.module.css";

export function PresenterSelectionScreen({
  state,
}: {
  state: PresenterSelectionState;
}) {
  const { translate } = useTranslation();

  return (
    <section className={styles.selection}>
      <h2 className={styles.prompt}>{translate(MessageKey.SelectionPrompt)}</h2>
      <p className={styles.progress} data-testid="submitted-count">
        {translate(MessageKey.SelectionSubmittedCount, {
          submitted: state.selection.submittedCount,
          total: state.participantCount,
        })}
      </p>
    </section>
  );
}
