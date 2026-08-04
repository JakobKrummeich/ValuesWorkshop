"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Subscription } from "rxjs";
import { participantJoinUrl } from "../../../../adapters/browserLocation";
import { copyToClipboard } from "../../../../adapters/clipboard";
import { MessageKey } from "../../../../domain/i18n/messages";

export interface FacilitatorJoinScreenResult {
  joinUrl: string | null;
  copyOutcome: MessageKey | null;
  copyJoinUrl: () => void;
}

export function useFacilitatorJoinScreen(): FacilitatorJoinScreenResult {
  const [copyOutcome, setCopyOutcome] = useState<MessageKey | null>(null);
  const inFlightCopy = useRef<Subscription | null>(null);
  const joinUrl = participantJoinUrl();

  useEffect(
    () => () => {
      inFlightCopy.current?.unsubscribe();
    },
    [],
  );

  const copyJoinUrl = useCallback(() => {
    if (joinUrl === null) {
      return;
    }

    inFlightCopy.current?.unsubscribe();
    inFlightCopy.current = copyToClipboard(joinUrl).subscribe({
      error() {
        setCopyOutcome(MessageKey.JoinUrlCopyFailed);
      },
      complete() {
        setCopyOutcome(MessageKey.JoinUrlCopied);
      },
    });
  }, [joinUrl]);

  return { joinUrl, copyOutcome, copyJoinUrl };
}
