"use client";

import { MessageKey } from "../../../../domain/i18n/messages";
import type { FacilitatorFinalPresentationState } from "../../../../domain/workshopState";
import { CheckMark } from "../../../CheckMark";
import { useTranslation } from "../../../i18n/useTranslation";
import { Pips } from "../../../Pips";
import styles from "./FacilitatorFinalPresentationScreen.module.css";
import { useFacilitatorFinalPresentationScreen } from "./useFacilitatorFinalPresentationScreen";

export function FacilitatorFinalPresentationScreen({
  state,
}: {
  state: FacilitatorFinalPresentationState;
}) {
  const { translate } = useTranslation();
  const {
    revealedCount,
    winnerCount,
    isConcluded,
    isRevealNextEnabled,
    isSending,
    rejectionMessage,
    revealNextValue,
  } = useFacilitatorFinalPresentationScreen(state);

  return (
    <section
      className={styles.screen}
      data-testid="facilitator-final-presentation-screen"
    >
      <p className={styles.revealedCount} data-testid="revealed-count">
        {translate(MessageKey.FinalPresentationRevealedCount, {
          revealed: revealedCount,
          total: winnerCount,
        })}
      </p>
      <Pips filled={revealedCount} total={winnerCount} testId="reveal-pips" />
      {!isConcluded && (
        <button
          type="button"
          className={styles.controlButton}
          data-testid="reveal-next-button"
          disabled={isSending || !isRevealNextEnabled}
          onClick={revealNextValue}
        >
          {translate(MessageKey.FinalPresentationRevealNext)}
        </button>
      )}
      {isConcluded && (
        <div className={styles.concluded}>
          <span className={styles.concludedMark}>
            <CheckMark />
          </span>
          <p className={styles.concludedNote} data-testid="concluded-note">
            {translate(MessageKey.FinalPresentationConcluded)}
          </p>
        </div>
      )}
      {rejectionMessage !== null && (
        <p className={styles.rejection} role="status">
          {translate(rejectionMessage)}
        </p>
      )}
    </section>
  );
}
