"use client";

import { MessageKey } from "../../domain/i18n/messages";
import { useTranslation } from "../i18n/useTranslation";
import styles from "./AdvancePhaseButton.module.css";
import { useAdvancePhaseButton } from "./useAdvancePhaseButton";

export function AdvancePhaseButton() {
  const { isAdvancing, rejectionMessage, advancePhase } =
    useAdvancePhaseButton();
  const { translate } = useTranslation();

  return (
    <div className={styles.container}>
      <button
        type="button"
        className={styles.button}
        disabled={isAdvancing}
        onClick={advancePhase}
      >
        {translate(MessageKey.AdvancePhase)}
      </button>
      {rejectionMessage !== null && (
        <p className={styles.rejection}>{translate(rejectionMessage)}</p>
      )}
    </div>
  );
}
