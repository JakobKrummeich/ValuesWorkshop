"use client";

import { useEffect, useRef, useState } from "react";
import type { Subscription } from "rxjs";
import { downloadBlob } from "../../../../adapters/fileDownload";
import { renderWorkshopRecordPdf } from "../../../../adapters/workshopRecordPdf";
import { MessageKey } from "../../../../domain/i18n/messages";
import { buildWorkshopRecord } from "../../../../domain/workshopRecordModel";
import type { ParticipantConclusionView } from "../../../../domain/workshopState";
import { useTranslation } from "../../../i18n/useTranslation";

const RECORD_FILE_NAME = "workshop-record.pdf";

export type ParticipantFinalPresentationModel =
  | { isConcluded: false }
  | {
      isConcluded: true;
      isDownloading: boolean;
      downloadFailedMessage: MessageKey | null;
      downloadRecord: () => void;
    };

export function useParticipantFinalPresentationScreen(
  conclusion: ParticipantConclusionView,
): ParticipantFinalPresentationModel {
  const { language } = useTranslation();
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadFailedMessage, setDownloadFailedMessage] =
    useState<MessageKey | null>(null);
  const subscriptionRef = useRef<Subscription | null>(null);
  useEffect(() => () => subscriptionRef.current?.unsubscribe(), []);

  if (!conclusion.isConcluded) {
    return { isConcluded: false };
  }

  const { record } = conclusion;

  const downloadRecord = () => {
    if (isDownloading) {
      return;
    }

    setIsDownloading(true);
    setDownloadFailedMessage(null);
    subscriptionRef.current = renderWorkshopRecordPdf(
      buildWorkshopRecord(record, language),
    ).subscribe({
      next: (blob) => downloadBlob(blob, RECORD_FILE_NAME),
      error: () => {
        setIsDownloading(false);
        setDownloadFailedMessage(MessageKey.FinalPresentationDownloadFailed);
      },
      complete: () => setIsDownloading(false),
    });
  };

  return {
    isConcluded: true,
    isDownloading,
    downloadFailedMessage,
    downloadRecord,
  };
}
