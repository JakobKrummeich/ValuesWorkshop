"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Subscription } from "rxjs";
import type { MessageKey } from "../../../../domain/i18n/messages";
import {
  GroupWorkStatus,
  type FacilitatorGroupWorkState,
  type FacilitatorGroupWorkGroups,
} from "../../../../domain/workshopState";
import { useFacilitatorDependencies } from "../../dependencies";

export interface FacilitatorGroupWorkScreenModel {
  groups: FacilitatorGroupWorkGroups;
  reassignScribe: (groupName: string, participantId: string) => void;
  allSubmitted: boolean;
  isSending: boolean;
  rejectionMessage: MessageKey | null;
}

export function useFacilitatorGroupWorkScreen(
  state: FacilitatorGroupWorkState,
): FacilitatorGroupWorkScreenModel {
  const { groupWorkControlPort } = useFacilitatorDependencies();
  const [isSending, setIsSending] = useState(false);
  const [rejectionMessage, setRejectionMessage] = useState<MessageKey | null>(
    null,
  );
  const intentSubscription = useRef<Subscription | null>(null);

  useEffect(
    () => () => {
      intentSubscription.current?.unsubscribe();
    },
    [],
  );

  const allSubmitted = state.groups.every(
    (group) => group.workStatus === GroupWorkStatus.Submitted,
  );

  const reassignScribe = useCallback(
    (groupName: string, participantId: string) => {
      setIsSending(true);
      intentSubscription.current?.unsubscribe();
      intentSubscription.current = groupWorkControlPort
        .reassignScribe(groupName, participantId)
        .subscribe({
          next(result) {
            setRejectionMessage(result.isAccepted ? null : null);
          },
          error() {
            setIsSending(false);
          },
          complete() {
            setIsSending(false);
          },
        });
    },
    [groupWorkControlPort],
  );

  return {
    groups: state.groups,
    reassignScribe,
    allSubmitted,
    isSending,
    rejectionMessage,
  };
}
