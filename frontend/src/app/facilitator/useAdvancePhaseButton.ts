"use client";

import { useCallback } from "react";
import { MessageKey } from "../../domain/i18n/messages";
import { phaseNameKey } from "../../domain/i18n/phaseNameKey";
import { nextPhase } from "../../domain/phaseSequence";
import type { Phase } from "../../domain/phases";
import { FacilitatorIntent } from "../../domain/workshopState";
import { useTranslation } from "../i18n/useTranslation";
import { useIntentSender } from "../useIntentSender";
import { usePhaseView } from "../usePhaseView";
import { useFacilitatorDependencies } from "./dependencies";

export interface AdvancePhaseButtonResult {
  nextPhaseLabel: string | null;
  isAdvancing: boolean;
  isAdvanceEnabled: boolean;
  rejectionMessage: MessageKey | null;
  advancePhase: () => void;
}

export function useAdvancePhaseButton(): AdvancePhaseButtonResult {
  const { lifecyclePort, sessionStatePort } = useFacilitatorDependencies();
  const state = usePhaseView(sessionStatePort);
  const { isSending, rejectionMessage, sendIntent } = useIntentSender();
  const { translate } = useTranslation();

  const advancePhase = useCallback(() => {
    sendIntent(lifecyclePort.advancePhase());
  }, [lifecyclePort, sendIntent]);

  const upcoming: Phase | null = state === null ? null : nextPhase(state.phase);

  return {
    nextPhaseLabel:
      upcoming === null
        ? null
        : translate(MessageKey.AdvanceToPhase, {
            phase: upcoming,
            name: translate(phaseNameKey(upcoming)),
          }),
    isAdvancing: isSending,
    isAdvanceEnabled:
      state !== null &&
      state.enabledIntents.includes(FacilitatorIntent.AdvancePhase),
    rejectionMessage,
    advancePhase,
  };
}
