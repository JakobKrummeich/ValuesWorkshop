"use client";

import styles from "./AdvancePhaseButton.module.css";
import { useAdvancePhaseButton } from "./useAdvancePhaseButton";

export function AdvancePhaseButton() {
  const { isAdvancing, rejectionDetail, advancePhase } =
    useAdvancePhaseButton();

  return (
    <div className={styles.container}>
      <button
        type="button"
        className={styles.button}
        disabled={isAdvancing}
        onClick={advancePhase}
      >
        Advance phase
      </button>
      {rejectionDetail !== null && (
        <p className={styles.rejection}>{rejectionDetail}</p>
      )}
    </div>
  );
}
