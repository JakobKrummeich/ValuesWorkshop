"use client";

import { MessageKey } from "../../../../domain/i18n/messages";
import type { ParticipantFinalPresentationState } from "../../../../domain/workshopState";
import { useTranslation } from "../../../i18n/useTranslation";
import { WaitingScreen } from "../../../WaitingScreen";
import styles from "./ParticipantFinalPresentationScreen.module.css";
import { useParticipantFinalPresentationScreen } from "./useParticipantFinalPresentationScreen";

export function ParticipantFinalPresentationScreen({
  state,
}: {
  state: ParticipantFinalPresentationState;
}) {
  const { translate } = useTranslation();
  const model = useParticipantFinalPresentationScreen(state.conclusion);

  if (!model.isConcluded) {
    return <WaitingScreen />;
  }

  return (
    <section className={styles.screen} data-testid="workshop-concluded">
      <h1 className={styles.heading}>
        {translate(MessageKey.FinalPresentationConcludedHeading)}
      </h1>
      <p className={styles.thanks}>
        {translate(MessageKey.FinalPresentationThanks)}
      </p>
      <button
        type="button"
        className={styles.downloadButton}
        data-testid="download-record-button"
        disabled={model.isDownloading}
        onClick={model.downloadRecord}
      >
        {translate(MessageKey.FinalPresentationDownloadPdf)}
      </button>
      {model.downloadFailedMessage !== null && (
        <p className={styles.failure} role="status">
          {translate(model.downloadFailedMessage)}
        </p>
      )}
    </section>
  );
}
