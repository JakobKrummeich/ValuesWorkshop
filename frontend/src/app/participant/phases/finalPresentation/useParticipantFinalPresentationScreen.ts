"use client";

import { useEffect, useRef, useState } from "react";
import type { Subscription } from "rxjs";
import { downloadBlob } from "../../../../adapters/fileDownload";
import { renderWorkshopRecordPdf } from "../../../../adapters/workshopRecordPdf";
import { MessageKey } from "../../../../domain/i18n/messages";
import { buildWorkshopRecord } from "../../../../domain/workshopRecordModel";
import type { ParticipantFinalPresentationState } from "../../../../domain/workshopState";
import { useTranslation } from "../../../i18n/useTranslation";

export type ParticipantFinalPresentationModel =
  | { isConcluded: false }
  | {
      isConcluded: true;
      ownAnimalId: string | null;
      isDownloading: boolean;
      downloadFailedMessage: MessageKey | null;
      downloadRecord: () => void;
    };

export function useParticipantFinalPresentationScreen(
  state: ParticipantFinalPresentationState,
): ParticipantFinalPresentationModel {
  const { language, translate } = useTranslation();
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadFailedMessage, setDownloadFailedMessage] =
    useState<MessageKey | null>(null);
  const subscriptionRef = useRef<Subscription | null>(null);
  useEffect(() => () => subscriptionRef.current?.unsubscribe(), []);

  if (!state.conclusion.isConcluded) {
    return { isConcluded: false };
  }

  const { record } = state.conclusion;

  const downloadRecord = () => {
    if (isDownloading) {
      return;
    }

    setIsDownloading(true);
    setDownloadFailedMessage(null);
    subscriptionRef.current = renderWorkshopRecordPdf(
      buildWorkshopRecord(record, language),
    ).subscribe({
      next: (blob) =>
        downloadBlob(
          blob,
          translate(MessageKey.FinalPresentationRecordFileName),
        ),
      error: () => {
        setIsDownloading(false);
        setDownloadFailedMessage(MessageKey.FinalPresentationDownloadFailed);
      },
      complete: () => setIsDownloading(false),
    });
  };

  return {
    isConcluded: true,
    ownAnimalId: state.ownGroup?.name.animalId ?? null,
    isDownloading,
    downloadFailedMessage,
    downloadRecord,
  };
}
