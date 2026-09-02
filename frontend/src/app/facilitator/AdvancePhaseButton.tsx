"use client";

import { MessageKey } from "../../domain/i18n/messages";
import { useTranslation } from "../i18n/useTranslation";
import styles from "./AdvancePhaseButton.module.css";
import { useAdvancePhaseButton } from "./useAdvancePhaseButton";

export function AdvancePhaseButton() {
  const {
    nextPhaseLabel,
    isAdvancing,
    isAdvanceEnabled,
    rejectionMessage,
    advancePhase,
  } = useAdvancePhaseButton();
  const { translate } = useTranslation();

  if (nextPhaseLabel === null) {
    return null;
  }

  return (
    <div className={styles.container}>
      {rejectionMessage !== null && (
        <p className={styles.rejection}>{translate(rejectionMessage)}</p>
      )}
      <button
        type="button"
        className={styles.button}
        aria-label={translate(MessageKey.AdvancePhase)}
        disabled={isAdvancing || !isAdvanceEnabled}
        onClick={advancePhase}
      >
        {nextPhaseLabel}
      </button>
    </div>
  );
}
