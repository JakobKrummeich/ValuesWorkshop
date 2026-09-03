"use client";

import { MessageKey } from "../../../../domain/i18n/messages";
import type { ParticipantFinalPresentationState } from "../../../../domain/workshopState";
import { AnimalGlyph } from "../../../AnimalGlyph";
import { BrandMark } from "../../../chrome/BrandMark";
import { Confetti } from "../../../Confetti";
import { useTranslation } from "../../../i18n/useTranslation";
import { ScreenCopy } from "../../../ScreenCopy";
import { WaitingScreen } from "../../../WaitingScreen";
import { ActionBar } from "../../ActionBar";
import { CallToAction } from "../../CallToAction";
import { useRememberedOwnGroup } from "../../OwnGroupMemoryProvider";
import styles from "./ParticipantFinalPresentationScreen.module.css";
import { useParticipantFinalPresentationScreen } from "./useParticipantFinalPresentationScreen";

export function ParticipantFinalPresentationScreen({
  state,
}: {
  state: ParticipantFinalPresentationState;
}) {
  const { translate } = useTranslation();
  const model = useParticipantFinalPresentationScreen(state.conclusion);
  const ownGroup = useRememberedOwnGroup();

  if (!model.isConcluded) {
    return (
      <WaitingScreen
        heading={MessageKey.WaitingEyesUpFront}
        body={MessageKey.WaitingForReveal}
      />
    );
  }

  return (
    <section
      className={styles.screen}
      data-testid="workshop-concluded"
      data-animal={ownGroup?.animalId}
    >
      <Confetti />
      <span className={styles.glyph} data-testid="conclusion-glyph">
        {ownGroup === null ? (
          <BrandMark />
        ) : (
          <AnimalGlyph animalId={ownGroup.animalId} />
        )}
      </span>
      <ScreenCopy
        heading={translate(MessageKey.FinalPresentationConcludedHeading)}
        body={translate(MessageKey.FinalPresentationThanks)}
      />
      {model.downloadFailedMessage !== null && (
        <p className={styles.failure} role="status">
          {translate(model.downloadFailedMessage)}
        </p>
      )}
      <ActionBar>
        <CallToAction
          testId="download-record-button"
          disabled={model.isDownloading}
          onClick={model.downloadRecord}
        >
          {translate(MessageKey.FinalPresentationDownloadPdf)}
        </CallToAction>
      </ActionBar>
    </section>
  );
}
