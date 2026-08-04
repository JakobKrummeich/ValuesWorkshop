"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Subscription } from "rxjs";
import { intentRejectionMessage } from "../../domain/i18n/intentRejectionMessage";
import { MessageKey } from "../../domain/i18n/messages";
import { useFacilitatorDependencies } from "./dependencies";

export interface AdvancePhaseButtonResult {
  isAdvancing: boolean;
  rejectionMessage: MessageKey | null;
  advancePhase: () => void;
}

export function useAdvancePhaseButton(): AdvancePhaseButtonResult {
  const { lifecycle } = useFacilitatorDependencies();
  const [isAdvancing, setAdvancing] = useState(false);
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

  const advancePhase = useCallback(() => {
    setAdvancing(true);
    inFlightIntent.current?.unsubscribe();
    inFlightIntent.current = lifecycle.advancePhase().subscribe({
      next(result) {
        setRejectionMessage(
          result.isAccepted ? null : intentRejectionMessage(result.code),
        );
      },
      error() {
        setRejectionMessage(MessageKey.IntentFailed);
        setAdvancing(false);
      },
      complete() {
        setAdvancing(false);
      },
    });
  }, [lifecycle]);

  return { isAdvancing, rejectionMessage, advancePhase };
}
