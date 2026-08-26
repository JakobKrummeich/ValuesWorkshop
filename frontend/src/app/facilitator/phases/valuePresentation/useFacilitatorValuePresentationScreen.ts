"use client";

import { useCallback } from "react";
import type { MessageKey } from "../../../../domain/i18n/messages";
import {
  presentationPositionOf,
  type PresentationPosition,
} from "../../../../domain/presentationPosition";
import {
  FacilitatorIntent,
  type FacilitatorValuePresentationState,
  type PresentedAction,
} from "../../../../domain/workshopState";
import { useIntentSender } from "../../../useIntentSender";
import { useFacilitatorDependencies } from "../../dependencies";

export type FacilitatorPresentationPosition =
  PresentationPosition<PresentedAction>;

export interface FacilitatorValuePresentationScreenModel {
  position: FacilitatorPresentationPosition | null;
  isNextValueEnabled: boolean;
  isSending: boolean;
  rejectionMessage: MessageKey | null;
  goToNextValue: () => void;
  correctActionWording: (actionId: string, text: string) => void;
}

export function useFacilitatorValuePresentationScreen(
  state: FacilitatorValuePresentationState,
): FacilitatorValuePresentationScreenModel {
  const { walkControlPort } = useFacilitatorDependencies();
  const { isSending, rejectionMessage, sendIntent } = useIntentSender();

  const goToNextValue = useCallback(() => {
    sendIntent(walkControlPort.goToNextValue());
  }, [walkControlPort, sendIntent]);

  const correctActionWording = useCallback(
    (actionId: string, text: string) => {
      sendIntent(walkControlPort.correctActionWording(actionId, text));
    },
    [walkControlPort, sendIntent],
  );

  return {
    position: presentationPositionOf(state.groups, state.presentation),
    isNextValueEnabled: state.enabledIntents.includes(
      FacilitatorIntent.GoToNextValue,
    ),
    isSending,
    rejectionMessage,
    goToNextValue,
    correctActionWording,
  };
}
