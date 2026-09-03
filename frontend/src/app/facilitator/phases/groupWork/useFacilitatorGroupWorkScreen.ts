"use client";

import { useCallback, useMemo } from "react";
import type { MessageKey } from "../../../../domain/i18n/messages";
import {
  GroupWorkStatus,
  type FacilitatorGroupWorkState,
  type GroupName,
  type RosterParticipant,
} from "../../../../domain/workshopState";
import { useIntentSender } from "../../../useIntentSender";
import { useFacilitatorDependencies } from "../../dependencies";

export interface FacilitatorGroupWorkRow {
  name: GroupName;
  members: RosterParticipant[];
  scribeParticipantId: string;
  workStatus: GroupWorkStatus;
  actionCount: number;
}

export interface FacilitatorGroupWorkScreenModel {
  rows: FacilitatorGroupWorkRow[];
  reassignScribe: (participantId: string) => void;
  isSending: boolean;
  rejectionMessage: MessageKey | null;
}

export function useFacilitatorGroupWorkScreen(
  state: FacilitatorGroupWorkState,
): FacilitatorGroupWorkScreenModel {
  const { groupWorkControlPort } = useFacilitatorDependencies();
  const { isSending, rejectionMessage, sendIntent } = useIntentSender();

  const rows = useMemo(
    () =>
      state.groups.map((group): FacilitatorGroupWorkRow => ({
        name: group.name,
        members: group.members,
        scribeParticipantId: group.scribeParticipantId ?? "",
        workStatus: group.workStatus ?? GroupWorkStatus.Editing,
        actionCount: Object.values(group.actionCountPerValue ?? {}).reduce(
          (sum, count) => sum + count,
          0,
        ),
      })),
    [state.groups],
  );

  const reassignScribe = useCallback(
    (participantId: string) => {
      sendIntent(groupWorkControlPort.reassignScribe(participantId));
    },
    [groupWorkControlPort, sendIntent],
  );

  return {
    rows,
    reassignScribe,
    isSending,
    rejectionMessage,
  };
}
