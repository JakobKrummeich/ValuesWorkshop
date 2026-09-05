"use client";

import { MessageKey } from "../../../../domain/i18n/messages";
import type { FacilitatorSelectionState } from "../../../../domain/workshopState";
import { useTranslation } from "../../../i18n/useTranslation";
import { ProgressRing } from "../../../ProgressRing";
import styles from "./FacilitatorSelectionScreen.module.css";

export function FacilitatorSelectionScreen({
  state,
}: {
  state: FacilitatorSelectionState;
}) {
  const { translate } = useTranslation();
  const total = state.roster.participantCount;
  const submitted = state.selection.submittedCount;

  return (
    <section className={styles.selection}>
      <div className={styles.ring}>
        <ProgressRing
          fraction={total === 0 ? 0 : submitted / total}
          label={translate(MessageKey.SelectionSubmittedCount, {
            submitted,
            total,
          })}
          testId="selection-progress"
        />
      </div>
      <div className={styles.copy}>
        <h2 className={styles.prompt}>
          {translate(MessageKey.SelectionPrompt)}
        </h2>
        <p className={styles.progress} data-testid="submitted-count">
          {translate(MessageKey.SelectionSubmittedCount, { submitted, total })}
        </p>
      </div>
    </section>
  );
}
