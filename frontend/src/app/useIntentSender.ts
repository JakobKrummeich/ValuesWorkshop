"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Subscription } from "rxjs";
import { intentRejectionMessage } from "../domain/i18n/intentRejectionMessage";
import { MessageKey } from "../domain/i18n/messages";
import type { IntentResult } from "../domain/intentResult";
import type { Single } from "../shared/reactiveTypes";

export interface IntentSender {
  isSending: boolean;
  rejectionMessage: MessageKey | null;
  sendIntent: (intent: Single<IntentResult>) => void;
}

export function useIntentSender(): IntentSender {
  const [isSending, setSending] = useState(false);
  const [rejectionMessage, setRejectionMessage] = useState<MessageKey | null>(
    null,
  );
  const inFlightIntent = useRef<Subscription | null>(null);

  useEffect(
    () => () => {
      inFlightIntent.current?.unsubscribe();
    },
    [],
  );

  const sendIntent = useCallback((intent: Single<IntentResult>) => {
    setSending(true);
    inFlightIntent.current?.unsubscribe();
    inFlightIntent.current = intent.subscribe({
      next(result) {
        setRejectionMessage(
          result.isAccepted ? null : intentRejectionMessage(result.code),
        );
      },
      error() {
        setRejectionMessage(MessageKey.IntentFailed);
        setSending(false);
      },
      complete() {
        setSending(false);
      },
    });
  }, []);

  return { isSending, rejectionMessage, sendIntent };
}
