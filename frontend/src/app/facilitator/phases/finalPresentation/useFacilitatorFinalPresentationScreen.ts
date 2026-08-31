"use client";

import { useCallback } from "react";
import type { MessageKey } from "../../../../domain/i18n/messages";
import {
  FacilitatorIntent,
  type FacilitatorFinalPresentationState,
} from "../../../../domain/workshopState";
import { useIntentSender } from "../../../useIntentSender";
import { useFacilitatorDependencies } from "../../dependencies";

export interface FacilitatorFinalPresentationScreenModel {
  revealedCount: number;
  winnerCount: number;
  isConcluded: boolean;
  isRevealNextEnabled: boolean;
  isSending: boolean;
  rejectionMessage: MessageKey | null;
  revealNextValue: () => void;
}

export function useFacilitatorFinalPresentationScreen(
  state: FacilitatorFinalPresentationState,
): FacilitatorFinalPresentationScreenModel {
  const { conclusionControlPort } = useFacilitatorDependencies();
  const { isSending, rejectionMessage, sendIntent } = useIntentSender();

  const revealNextValue = useCallback(() => {
    sendIntent(conclusionControlPort.revealNextValue());
  }, [conclusionControlPort, sendIntent]);

  return {
    revealedCount: state.conclusion.revealedCount,
    winnerCount: state.conclusion.winners.length,
    isConcluded: state.conclusion.isConcluded,
    isRevealNextEnabled: state.enabledIntents.includes(
      FacilitatorIntent.RevealNextValue,
    ),
    isSending,
    rejectionMessage,
    revealNextValue,
  };
}
