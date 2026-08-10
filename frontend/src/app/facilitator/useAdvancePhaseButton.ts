"use client";

import { useCallback } from "react";
import type { MessageKey } from "../../domain/i18n/messages";
import { useIntentSender } from "../useIntentSender";
import { useFacilitatorDependencies } from "./dependencies";

export interface AdvancePhaseButtonResult {
  isAdvancing: boolean;
  rejectionMessage: MessageKey | null;
  advancePhase: () => void;
}

export function useAdvancePhaseButton(): AdvancePhaseButtonResult {
  const { lifecycle } = useFacilitatorDependencies();
  const { isSending, rejectionMessage, sendIntent } = useIntentSender();

  const advancePhase = useCallback(() => {
    sendIntent(lifecycle.advancePhase());
  }, [lifecycle, sendIntent]);

  return { isAdvancing: isSending, rejectionMessage, advancePhase };
}
