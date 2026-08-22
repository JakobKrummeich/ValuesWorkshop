"use client";

import { useCallback } from "react";
import type { MessageKey } from "../../domain/i18n/messages";
import { FacilitatorIntent } from "../../domain/workshopState";
import { useIntentSender } from "../useIntentSender";
import { usePhaseView } from "../usePhaseView";
import { useFacilitatorDependencies } from "./dependencies";

export interface AdvancePhaseButtonResult {
  isAdvancing: boolean;
  isAdvanceEnabled: boolean;
  rejectionMessage: MessageKey | null;
  advancePhase: () => void;
}

export function useAdvancePhaseButton(): AdvancePhaseButtonResult {
  const { lifecyclePort, sessionStatePort } = useFacilitatorDependencies();
  const { state } = usePhaseView(sessionStatePort);
  const { isSending, rejectionMessage, sendIntent } = useIntentSender();

  const advancePhase = useCallback(() => {
    sendIntent(lifecyclePort.advancePhase());
  }, [lifecyclePort, sendIntent]);

  return {
    isAdvancing: isSending,
    isAdvanceEnabled:
      state !== null &&
      state.enabledIntents.includes(FacilitatorIntent.AdvancePhase),
    rejectionMessage,
    advancePhase,
  };
}
