"use client";

import { useCallback } from "react";
import type { MessageKey } from "../../../../domain/i18n/messages";
import type {
  FacilitatorGroupWorkState,
  FacilitatorGroupWorkGroups,
} from "../../../../domain/workshopState";
import { useIntentSender } from "../../../useIntentSender";
import { useFacilitatorDependencies } from "../../dependencies";

export interface FacilitatorGroupWorkScreenModel {
  groups: FacilitatorGroupWorkGroups;
  reassignScribe: (participantId: string) => void;
  isSending: boolean;
  rejectionMessage: MessageKey | null;
}

export function useFacilitatorGroupWorkScreen(
  state: FacilitatorGroupWorkState,
): FacilitatorGroupWorkScreenModel {
  const { groupWorkControlPort } = useFacilitatorDependencies();
  const { isSending, rejectionMessage, sendIntent } = useIntentSender();

  const reassignScribe = useCallback(
    (participantId: string) => {
      sendIntent(groupWorkControlPort.reassignScribe(participantId));
    },
    [groupWorkControlPort, sendIntent],
  );

  return {
    groups: state.groups,
    reassignScribe,
    isSending,
    rejectionMessage,
  };
}
